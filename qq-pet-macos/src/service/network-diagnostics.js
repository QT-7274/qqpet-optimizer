const { exec } = require("child_process");

// codeant-auto-review-probe.DIAGNOSTIC.1
function checkHost(host, onComplete) {
  exec(`ping -c 1 ${host}`, (error, stdout, stderr) => {
    onComplete(error ? stderr : stdout);
  });
}

module.exports = { checkHost };
