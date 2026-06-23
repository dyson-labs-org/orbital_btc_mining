import { productStatus, statusJson } from "./status.mjs";

const args = process.argv.slice(2);

function writeHelp() {
  process.stdout.write(
    [
      "Orbital Compute Lab",
      "",
      "Commands:",
      "  status        Print deterministic incubation skeleton status.",
      "  status --json Print the status object as JSON.",
      "  help          Print this help.",
      "",
      "No simulation kernel, scheduler, Bitcoin workload, AI workload, wallet,",
      "trading, external network, hardware, or mission-authority behavior is implemented."
    ].join("\n") + "\n"
  );
}

function writeStatusText() {
  process.stdout.write(`${productStatus.product_name}\n`);
  process.stdout.write(`status: ${productStatus.implementation_status}\n`);
  process.stdout.write(`maturity: ${productStatus.maturity}\n`);
  process.stdout.write("simulation: not implemented\n");
  process.stdout.write("bitcoin behavior: not implemented\n");
  process.stdout.write("ai behavior: not implemented\n");
  process.stdout.write("external network: none\n");
}

function main(argv) {
  const [command, option, extra] = argv;

  if (!command || command === "help") {
    writeHelp();
    return 0;
  }

  if (command === "status") {
    if (extra || (option && option !== "--json")) {
      process.stderr.write("Unknown status option. Use `status` or `status --json`.\n");
      return 2;
    }
    if (option === "--json") {
      process.stdout.write(statusJson());
      return 0;
    }
    writeStatusText();
    return 0;
  }

  process.stderr.write(`Unknown command: ${command}\n`);
  process.stderr.write("Run `node src/cli.mjs help` for usage.\n");
  return 2;
}

process.exitCode = main(args);
