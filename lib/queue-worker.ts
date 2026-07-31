import { calculateDomainAudit } from './audit-engine';
import { saveAuditReport } from './db';

export interface AuditJob {
  id: string;
  domain: string;
  orgId?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

const jobQueue: AuditJob[] = [];

export async function enqueueAuditJob(domain: string, orgId?: string): Promise<AuditJob> {
  const job: AuditJob = {
    id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    domain,
    orgId,
    status: 'queued',
    createdAt: new Date().toISOString()
  };

  jobQueue.push(job);

  // Trigger async background processing worker
  setTimeout(() => processNextAuditJob(), 100);

  return job;
}

async function processNextAuditJob() {
  const nextJob = jobQueue.find((j) => j.status === 'queued');
  if (!nextJob) return;

  nextJob.status = 'processing';
  try {
    const audit = calculateDomainAudit(nextJob.domain);
    await saveAuditReport(nextJob.domain, audit);
    nextJob.status = 'completed';
  } catch {
    nextJob.status = 'failed';
  }
}

export function getJobStatus(jobId: string): AuditJob | undefined {
  return jobQueue.find((j) => j.id === jobId);
}
