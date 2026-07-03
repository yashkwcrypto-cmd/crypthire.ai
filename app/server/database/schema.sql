-- CryptHire AI Database Schema for SQL Server
-- Note: Tables are created in the database specified by the connection string.


-- Users table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        email NVARCHAR(255) UNIQUE NOT NULL,
        password NVARCHAR(255) NOT NULL,
        name NVARCHAR(255),
        role NVARCHAR(50) DEFAULT 'admin',
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Candidates table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Candidates')
BEGIN
    CREATE TABLE Candidates (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        fullName NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        phone NVARCHAR(50),
        resumeUrl NVARCHAR(500) NOT NULL,
        status NVARCHAR(50) DEFAULT 'pending',
        analysisResult NVARCHAR(MAX),
        notes NVARCHAR(MAX),
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- AnalysisJobs table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AnalysisJobs')
BEGIN
    CREATE TABLE AnalysisJobs (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        candidateId UNIQUEIDENTIFIER NOT NULL,
        status NVARCHAR(50) DEFAULT 'queued',
        result NVARCHAR(MAX),
        error NVARCHAR(MAX),
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (candidateId) REFERENCES Candidates(id) ON DELETE CASCADE
    );
END
GO

-- Create index on AnalysisJobs.candidateId for faster lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AnalysisJobs_CandidateId' AND object_id = OBJECT_ID('AnalysisJobs'))
BEGIN
    CREATE INDEX IX_AnalysisJobs_CandidateId ON AnalysisJobs(candidateId);
END
GO

-- Create index on Users.email for faster lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Email' AND object_id = OBJECT_ID('Users'))
BEGIN
    CREATE INDEX IX_Users_Email ON Users(email);
END
GO

-- Create index on Candidates.email for faster lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Candidates_Email' AND object_id = OBJECT_ID('Candidates'))
BEGIN
    CREATE INDEX IX_Candidates_Email ON Candidates(email);
END
GO

-- Insert default admin user (password is 'admin123')
INSERT INTO Users (email, password, name, role)
SELECT 'admin@admin.com', '$2a$10$jTeV9QBDYo6HAwec6NjSOOhituaGjdAWiQiqa5ZYnhtGxOe.DlsPm', 'Admin User', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM Users WHERE email = 'admin@admin.com');
GO
