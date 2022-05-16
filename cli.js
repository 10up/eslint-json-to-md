#!/usr/bin/env node
import meow from "meow";
import fs from "fs";

async function run() {
	const cli = meow(
		`
	Usage
	  $ ./eslint-json-to-md

	Options:
`,
		{
			importMeta: import.meta,
			flags: {
				path: {
					type: "string",
					isRequired: true,
				},
				output: {
					type: "string",
					isRequired: true,
				},
			},
		}
	);

	const getDisplayPath = (filePath, label = "", line = 0) => {
		console.log(process.cwd());
		filePath = filePath.replace(process.cwd(), "").replace(/^\/+/, '');

		if (!label) {
			label = filePath;
		}

		if (!process.env.GITHUB_SHA || !process.env.GITHUB_REPOSITORY) {
			return label;
		}

		let url = `https://github.com/${process.env.GITHUB_REPOSITORY}/blob/${process.env.GITHUB_SHA}/${filePath}`;

		if (line) {
			url += `#L${line}`;
		}

		return `[${label}](${url})`;
	};

	let data;
	try {
		const json = fs.readFileSync(cli.flags.path, "utf-8");
		data = JSON.parse(json);
	} catch (err) {
		console.log("Error: Can not read the JSON file.");
		console.log(err);
		process.exit(1);
	}

	const stream = fs.createWriteStream(cli.flags.output);

	data = data.filter((item) => {
		return item.errorCount + item.warningCount > 0;
	});

	const totalError = data.reduce((acc, item) => {
		return acc + item.errorCount;
	}, 0);

	const totalWarning = data.reduce((acc, item) => {
		return acc + item.warningCount;
	}, 0);

	stream.write(
		`> **Found \`${totalError} errors, ${totalWarning} warnings\` - Generated on ${new Date(
			Date.now()
		).toUTCString()}.**\n`
	);

	stream.write("---\n");

	data.forEach((file) => {
		stream.write(
			`#### :clipboard: ${getDisplayPath(
				file.filePath
			)} - :small_red_triangle: ${
				file.errorCount
			} errors & :small_orange_diamond: ${file.warningCount} warnings\n`
		);
		stream.write(`| # | Type | Message | Rule ID |\n`);
		stream.write(`| --- | --- | --- | --- |\n`);

		file.messages.map((message) => {
			stream.write(
				`| ${getDisplayPath(
					file.filePath,
					message.line,
					message.line
				)} | ${(message.severity = 2 ? "Error" : "Warning")} | ${
					message.message
				} | \`${message.ruleId}\` |\n`
			);
		});
	});

}

run();
