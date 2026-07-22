import { useEffect, useRef } from 'react';
import { getJobStatus } from '../api';

export function useJobPolling(jobs, onUpdate) {
  const intervalRefs = useRef({});

  useEffect(() => {
    jobs.forEach((job) => {
      if (job.status === 'completed' || job.status === 'failed') {
        if (intervalRefs.current[job.job_id]) {
          clearInterval(intervalRefs.current[job.job_id]);
          delete intervalRefs.current[job.job_id];
        }
        return;
      }

      if (intervalRefs.current[job.job_id]) return;

      intervalRefs.current[job.job_id] = setInterval(async () => {
        try {
          const updated = await getJobStatus(job.job_id);
          onUpdate(updated);
          if (updated.status === 'completed' || updated.status === 'failed') {
            clearInterval(intervalRefs.current[updated.job_id]);
            delete intervalRefs.current[updated.job_id];
          }
        } catch {
          clearInterval(intervalRefs.current[job.job_id]);
          delete intervalRefs.current[job.job_id];
        }
      }, 2000);
    });

    return () => {
      Object.values(intervalRefs.current).forEach(clearInterval);
      intervalRefs.current = {};
    };
  }, [jobs.length]);
}
