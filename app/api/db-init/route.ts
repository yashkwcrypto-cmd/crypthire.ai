import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { executeQuery } from '../../server/db/connection';

export async function GET() {
  try {
    const schemaPath = path.join(process.cwd(), 'app', 'server', 'database', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    const batches = sql.split(/\bGO\b/i).filter(b => b.trim().length > 0);
    
    for (const batch of batches) {
      if (batch.trim()) {
        await executeQuery(batch);
      }
    }
    
    return NextResponse.json({ success: true, message: 'Database initialized successfully!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
