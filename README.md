# CryptHire AI

An AI-powered recruitment platform that automates resume analysis and candidate evaluation using intelligent algorithms.

## Features

- **AI-Powered Resume Analysis**: Automatically analyzes resumes to identify skills, experience, and fit
- **Candidate Management**: Track candidates through the hiring pipeline
- **Admin Dashboard**: Comprehensive dashboard for recruiters and admins
- **Report Generation**: Generate detailed reports in JSON or CSV format
- **Email Notifications**: Automated email notifications for candidates
- **Secure Authentication**: JWT-based authentication with role-based access control
- **SQL Server Database**: Robust database backend with Microsoft SQL Server

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Microsoft SQL Server with mssql driver
- **Authentication**: JWT with bcryptjs
- **Validation**: Joi
- **Email**: Nodemailer
- **PDF Parsing**: pdf-parse

## Prerequisites

- Node.js 20+
- Microsoft SQL Server
- npm, yarn, or pnpm

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd crypthire.ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DB_SERVER=localhost
DB_NAME=CryptHire
DB_USER=sa
DB_PASSWORD=your_password
DB_ENCRYPT=false

JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@crypthire.ai
```

4. Set up the database:
```bash
# Run the SQL script in SQL Server Management Studio or via command line
sqlcmd -S localhost -U sa -P your_password -i database/schema.sql
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### For Candidates

1. Navigate to `/portal/apply`
2. Fill out the application form with your details
3. Provide a resume URL (upload to cloud storage first)
4. Submit your application

### For Admins

1. Navigate to `/portal/admin`
2. Login with your credentials (default admin will be created by database script)
3. View and manage candidates
4. Trigger AI analysis on resumes
5. Update candidate status
6. Download reports

## API Endpoints

### Authentication
- `POST /api/auth` - Login or Register (use `action` field)

### Candidates
- `POST /api/candidate` - Submit candidate application
- `GET /api/admin/candidates` - Get all candidates (admin only)
- `GET /api/admin/candidates/[id]` - Get specific candidate (admin only)
- `PATCH /api/admin/candidates/[id]` - Update candidate status (admin only)

### Analysis
- `POST /api/admin/analyze` - Trigger AI analysis (admin only)

### Reports
- `GET /api/admin/report` - Generate report (JSON or CSV format)

### Notifications
- `POST /api/admin/notify` - Send interview/rejection emails (admin only)

### Health
- `GET /api/health` - Health check endpoint

## Database Schema

The application uses three main tables:
- **Users**: Admin and recruiter accounts
- **Candidates**: Submitted candidate applications
- **AnalysisJobs**: AI analysis job tracking

See `database/schema.sql` for the complete schema.

## Security Notes

- Change the default JWT_SECRET in production
- Use strong database passwords
- Configure SMTP with app-specific passwords
- Enable SSL/TLS for database connections in production
- Implement rate limiting for API endpoints

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
npm start
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
