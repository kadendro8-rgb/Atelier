/**
 * Publish queue + platform adapters.
 *
 * The queue is platform-agnostic: it holds scheduled posts and, when a slot
 * is due, hands the post to the adapter registered for that platform. The
 * default adapters are dry-run — they validate and serialize the post and
 * return a synthetic id, so the whole pipeline runs end-to-end with no
 * credentials.
 *
 * GOING LIVE: implement a real {@link PublishAdapter} per platform (Meta
 * Graph API for Instagram/Facebook, the X API, the LinkedIn API, etc.),
 * read the tokens documented in `.env.example`, and pass the live adapters
 * to {@link PublishQueue}. See `docs/factory/E2-marketing.md` for the
 * credential checklist — that step is a foreman task.
 */
import { trimToLimit } from "./platforms";
import { PLATFORMS } from "./types";
import type {
  Platform,
  PublishAdapter,
  PublishJob,
  PublishResult,
  SocialPost,
} from "./types";

const MAX_ATTEMPTS = 3;

/**
 * Dry-run adapter: the safe default. Validates the post against the
 * platform's caption limit, logs it, and returns a synthetic id. No network,
 * no credentials, no side effects.
 */
export class DryRunAdapter implements PublishAdapter {
  readonly live = false;

  constructor(readonly platform: Platform) {}

  async publish(post: SocialPost): Promise<PublishResult> {
    const trimmed = trimToLimit(post.caption, this.platform);
    if (trimmed !== post.caption) {
      return { ok: false, error: "caption exceeds platform limit" };
    }
    const externalId = `dryrun_${this.platform}_${post.id}`;
    return {
      ok: true,
      externalId,
      url: `https://example.invalid/${this.platform}/${externalId}`,
    };
  }
}

/** A registry of dry-run adapters for every platform. */
export function dryRunAdapters(): Record<Platform, PublishAdapter> {
  const reg = {} as Record<Platform, PublishAdapter>;
  for (const p of PLATFORMS) reg[p] = new DryRunAdapter(p);
  return reg;
}

let jobCounter = 0;

/** A scheduled, retrying publish queue. */
export class PublishQueue {
  private jobs: PublishJob[] = [];

  constructor(
    private readonly adapters: Record<
      Platform,
      PublishAdapter
    > = dryRunAdapters(),
  ) {}

  /** Schedule one post. `scheduledFor` is an ISO datetime. */
  enqueue(post: SocialPost, scheduledFor: string): PublishJob {
    const job: PublishJob = {
      id: `job_${Date.now().toString(36)}_${(jobCounter++).toString(36)}`,
      post,
      status: "scheduled",
      scheduledFor,
      attempts: 0,
    };
    this.jobs.push(job);
    return job;
  }

  /** Schedule many posts that share a publish time. */
  enqueueMany(posts: SocialPost[], scheduledFor: string): PublishJob[] {
    return posts.map((p) => this.enqueue(p, scheduledFor));
  }

  /** All jobs, newest scheduling preserved. */
  list(): readonly PublishJob[] {
    return this.jobs;
  }

  /** Jobs whose scheduled time has arrived and that are not yet published. */
  due(now: Date = new Date()): PublishJob[] {
    const ts = now.getTime();
    return this.jobs.filter(
      (j) =>
        (j.status === "scheduled" || j.status === "draft") &&
        Date.parse(j.scheduledFor) <= ts,
    );
  }

  /**
   * Publish every due job through its platform adapter. Failures are retried
   * on the next run up to {@link MAX_ATTEMPTS}, after which the job is marked
   * `failed`. Returns the jobs that were processed this pass.
   */
  async runDue(now: Date = new Date()): Promise<PublishJob[]> {
    const due = this.due(now);
    for (const job of due) {
      const adapter = this.adapters[job.post.platform];
      job.status = "publishing";
      job.attempts += 1;
      try {
        const result = await adapter.publish(job.post);
        if (result.ok) {
          job.status = "published";
          job.externalId = result.externalId;
          delete job.error;
        } else {
          job.error = result.error ?? "unknown error";
          job.status = job.attempts >= MAX_ATTEMPTS ? "failed" : "scheduled";
        }
      } catch (err) {
        job.error = err instanceof Error ? err.message : String(err);
        job.status = job.attempts >= MAX_ATTEMPTS ? "failed" : "scheduled";
      }
    }
    return due;
  }

  /** A status tally for dashboards / CLI reporting. */
  summary(): Record<PublishJob["status"], number> {
    const tally: Record<PublishJob["status"], number> = {
      draft: 0,
      scheduled: 0,
      publishing: 0,
      published: 0,
      failed: 0,
    };
    for (const j of this.jobs) tally[j.status] += 1;
    return tally;
  }

  /** Serialize the queue for file persistence. */
  toJSON(): PublishJob[] {
    return this.jobs;
  }

  /** Restore a queue from {@link toJSON} output. */
  static fromJSON(
    jobs: PublishJob[],
    adapters: Record<Platform, PublishAdapter> = dryRunAdapters(),
  ): PublishQueue {
    const q = new PublishQueue(adapters);
    q.jobs = jobs;
    return q;
  }
}
