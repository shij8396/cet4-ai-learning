import chalk from "chalk";

const symbols = {
  pass: chalk.green("✓"),
  fail: chalk.red("✗"),
  warn: chalk.yellow("⚠"),
  info: chalk.blue("ℹ"),
  arrow: chalk.gray("→"),
  star: chalk.yellow("★"),
};

export const log = {
  header(text: string): void {
    console.log(`\n${chalk.bold.blue("═══")} ${chalk.bold.white(text)} ${chalk.bold.blue("═══")}`);
  },

  section(text: string): void {
    console.log(`\n${chalk.bold.cyan("──")} ${chalk.bold(text)} ${chalk.bold.cyan("──")}`);
  },

  pass(text: string): void {
    console.log(`  ${symbols.pass} ${chalk.green(text)}`);
  },

  fail(text: string, fix?: string): void {
    console.log(`  ${symbols.fail} ${chalk.red(text)}`);
    if (fix) {
      console.log(`     ${symbols.arrow} ${chalk.gray("修复:")} ${chalk.white(fix)}`);
    }
  },

  warn(text: string, fix?: string): void {
    console.log(`  ${symbols.warn} ${chalk.yellow(text)}`);
    if (fix) {
      console.log(`     ${symbols.arrow} ${chalk.gray("建议:")} ${chalk.white(fix)}`);
    }
  },

  info(text: string): void {
    console.log(`  ${symbols.info} ${chalk.gray(text)}`);
  },

  file(path: string, line?: number): string {
    const location = line ? `${path}:${line}` : path;
    return chalk.underline.dim(location);
  },

  score(score: number): void {
    const color = score >= 90 ? chalk.green : score >= 70 ? chalk.yellow : chalk.red;
    const bar = buildBar(score);
    console.log(`\n  ${chalk.bold("项目健康评分")}: ${color.bold(score + "/100")}`);
    console.log(`  [${color(bar)}]`);
  },

  summary(passed: number, total: number): void {
    const color = passed === total ? chalk.green : chalk.yellow;
    console.log(`\n  ${color.bold("检查通过")}: ${passed}/${total}`);
  },

  divider(): void {
    console.log(chalk.gray("─".repeat(50)));
  },

  title(text: string): void {
    console.log(`\n${chalk.bold.magenta("┌─")} ${chalk.bold.white(text)}`);
  },

  item(text: string): void {
    console.log(`  ${chalk.gray("│")} ${text}`);
  },

  footer(): void {
    console.log(chalk.bold.magenta("└" + "─".repeat(49)));
  },
};

function buildBar(score: number): string {
  const filled = Math.round(score / 5);
  const empty = 20 - filled;
  const color = score >= 90 ? chalk.green : score >= 70 ? chalk.yellow : chalk.red;
  return color("█".repeat(filled)) + chalk.gray("░".repeat(empty));
}

export { symbols };
