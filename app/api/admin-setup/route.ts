import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { executeScalar } from '../../server/db/connection';

export async function GET() {
  try {
    const email = 'admin@crypthire.ai';
    const password = 'Admin@123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user exists
    const existing = await executeScalar(`SELECT id FROM Users WHERE email = '${email}'`);
    
    if (existing) {
      await executeScalar(`UPDATE Users SET password = '${hashedPassword}' WHERE email = '${email}'`);
    } else {
      await executeScalar(`
        INSERT INTO Users (id, email, password, name, role, createdAt, updatedAt)
        VALUES (NEWID(), '${email}', '${hashedPassword}', 'Admin User', 'admin', GETDATE(), GETDATE())
      `);
    }
    
    return NextResponse.json({ success: true, message: 'Admin setup complete' });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
