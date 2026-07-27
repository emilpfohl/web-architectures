const queue = [];
let processing = false;

function enqueueMail(job) {
  queue.push(job);
  processQueue();
}

async function processQueue() {
  if (processing) return;
  processing = true;

  while (queue.length > 0) {
    const job = queue.shift();
    try {
      await job();
    } catch (error) {
      console.error('Mail queue job failed:', error);
    }
  }

  processing = false;
}

module.exports = { enqueueMail };
