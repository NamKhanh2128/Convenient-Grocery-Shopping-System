/**
 * Giải phóng cổng backend (mặc định 3000) trên Windows / Unix.
 */
const { execSync } = require('child_process');

const port = String(process.env.PORT || 3000);

function killWindows() {
  let out = '';
  try {
    out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
  } catch {
    console.log(`Cổng ${port} không có process LISTENING.`);
    return;
  }

  const pids = new Set();
  for (const line of out.split('\n')) {
    if (!line.includes('LISTENING')) continue;
    const parts = line.trim().split(/\s+/);
    const pid = Number(parts[parts.length - 1]);
    if (pid > 0) pids.add(pid);
  }

  if (!pids.size) {
    console.log(`Cổng ${port} không có process LISTENING.`);
    return;
  }

  for (const pid of pids) {
    try {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      console.log(`Đã dừng process PID ${pid} (cổng ${port}).`);
    } catch {
      console.warn(`Không dừng được PID ${pid}.`);
    }
  }
}

function killUnix() {
  try {
    execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'inherit' });
    console.log(`Đã giải phóng cổng ${port}.`);
  } catch {
    console.log(`Cổng ${port} không có process hoặc đã trống.`);
  }
}

if (process.platform === 'win32') {
  killWindows();
} else {
  killUnix();
}
