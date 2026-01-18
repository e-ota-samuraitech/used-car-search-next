/**
 * Vertex AI Search (Discovery Engine) 用 JSONL 変換スクリプト
 *
 * 入力:  data/vertex/cars_dummy.jsonl (Car型互換)
 * 出力:  data/vertex/cars_dummy.discoveryengine.jsonl
 *
 * 変換形式:
 *   { "id": "<car.id>", "structData": <元のJSONそのまま> }
 *
 * 実行方法:
 *   npx tsx tools/convert-for-discovery-engine.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Discovery Engine ドキュメント形式
interface DiscoveryEngineDocument {
  id: string;
  structData: Record<string, unknown>;
}

function main(): void {
  const inputPath = path.resolve(__dirname, '../data/vertex/cars_dummy.jsonl');
  const outputPath = path.resolve(__dirname, '../data/vertex/cars_dummy.discoveryengine.jsonl');

  // 入力ファイル存在確認
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    console.error('Run "npx tsx tools/generate-dummy-data.ts" first.');
    process.exit(1);
  }

  const content = fs.readFileSync(inputPath, 'utf-8');
  const lines = content.split('\n').filter((line) => line.trim() !== '');

  const outputLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: Failed to parse JSON at line ${lineNumber}`);
      console.error(`  ${message}`);
      console.error(`  Line content: ${line.slice(0, 100)}...`);
      process.exit(1);
    }

    // parsed が object であることを確認
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      console.error(`Error: Line ${lineNumber} is not a valid JSON object`);
      process.exit(1);
    }

    const record = parsed as Record<string, unknown>;

    // id フィールドの存在確認
    if (typeof record['id'] !== 'string' || record['id'] === '') {
      console.error(`Error: Line ${lineNumber} does not have a valid "id" field`);
      process.exit(1);
    }

    const docId = record['id'];

    // Discovery Engine 形式に変換
    const doc: DiscoveryEngineDocument = {
      id: docId,
      structData: record,
    };

    outputLines.push(JSON.stringify(doc));
  }

  // 出力ディレクトリ確認
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, outputLines.join('\n') + '\n', 'utf-8');

  console.log(`Converted ${outputLines.length} documents.`);
  console.log(`Output: ${outputPath}`);
  console.log('');
  console.log('Sample (first line):');
  console.log(outputLines[0]);
}

main();
