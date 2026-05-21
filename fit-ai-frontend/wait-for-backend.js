const net = require("net");
const [host = "backend", portArg = "8081"] = process.argv.slice(2);
const port = parseInt(portArg, 10);
const retryMs = 1000;

const waitForBackend = () =>
  new Promise((resolve) => {
    const socket = net.createConnection({ host, port }, () => {
      socket.destroy();
      resolve(true);
    });

    socket.on("error", () => {
      socket.destroy();
      setTimeout(() => resolve(false), retryMs);
    });
  });

(async () => {
  process.stdout.write(`Waiting for backend ${host}:${port}`);
  while (!(await waitForBackend())) {
    process.stdout.write(".");
  }
  process.stdout.write("\nBackend available, starting frontend...\n");
  process.exit(0);
})();
