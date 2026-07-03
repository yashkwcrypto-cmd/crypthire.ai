import { executeQuery, executeScalar } from './connection';
import { User, Candidate, AnalysisJob, JobDescription } from '../types';

// User Queries
export const userQueries = {
  create: async (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    const query = `
      INSERT INTO Users (id, email, password, name, role, createdAt, updatedAt)
      OUTPUT INSERTED.*
      VALUES (NEWID(), @email, @password, @name, @role, GETDATE(), GETDATE())
    `;
    const result = await executeScalar<User>(query, user);
    if (!result) throw new Error('Failed to create user');
    return result;
  },

  findByEmail: async (email: string): Promise<User | null> => {
    const query = 'SELECT * FROM Users WHERE email = @email';
    return await executeScalar<User>(query, { email });
  },

  findById: async (id: string): Promise<User | null> => {
    const query = 'SELECT * FROM Users WHERE id = @id';
    return await executeScalar<User>(query, { id });
  },

  getAll: async (): Promise<User[]> => {
    const query = 'SELECT * FROM Users';
    return await executeQuery<User>(query);
  },
};

// Candidate Queries
export const candidateQueries = {
  create: async (candidate: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>): Promise<Candidate> => {
    const query = `
      INSERT INTO Candidates (id, fullName, email, phone, linkedinUrl, portfolioUrl, resumeUrl, status, analysisResult, notes, createdAt, updatedAt)
      OUTPUT INSERTED.*
      VALUES (NEWID(), @fullName, @email, @phone, @linkedinUrl, @portfolioUrl, @resumeUrl, @status, @analysisResult, @notes, GETDATE(), GETDATE())
    `;
    const result = await executeScalar<Candidate>(query, candidate);
    if (!result) throw new Error('Failed to create candidate');
    return result;
  },

  findById: async (id: string): Promise<Candidate | null> => {
    const query = 'SELECT * FROM Candidates WHERE id = @id';
    return await executeScalar<Candidate>(query, { id });
  },

  getAll: async (): Promise<Candidate[]> => {
    const query = 'SELECT * FROM Candidates ORDER BY createdAt DESC';
    return await executeQuery<Candidate>(query);
  },

  updateStatus: async (id: string, status: string): Promise<Candidate | null> => {
    const query = `
      UPDATE Candidates
      SET status = @status, updatedAt = GETDATE()
      OUTPUT INSERTED.*
      WHERE id = @id
    `;
    return await executeScalar<Candidate>(query, { id, status });
  },

  updateAnalysisResult: async (id: string, analysisResult: string): Promise<Candidate | null> => {
    const query = `
      UPDATE Candidates
      SET analysisResult = @analysisResult, updatedAt = GETDATE()
      OUTPUT INSERTED.*
      WHERE id = @id
    `;
    return await executeScalar<Candidate>(query, { id, analysisResult });
  },

  updateNotes: async (id: string, notes: string): Promise<Candidate | null> => {
    const query = `
      UPDATE Candidates
      SET notes = @notes, updatedAt = GETDATE()
      OUTPUT INSERTED.*
      WHERE id = @id
    `;
    return await executeScalar<Candidate>(query, { id, notes });
  },

  update: async (id: string, data: Partial<Candidate>): Promise<Candidate | null> => {
    if (Object.keys(data).length === 0) return await candidateQueries.findById(id);

    const setClauses: string[] = [];
    const params: any = { id };

    for (const [key, value] of Object.entries(data)) {
      setClauses.push(`${key} = @${key}`);
      params[key] = value;
    }
    setClauses.push('updatedAt = GETDATE()');

    const query = `
      UPDATE Candidates
      SET ${setClauses.join(', ')}
      OUTPUT INSERTED.*
      WHERE id = @id
    `;
    return await executeScalar<Candidate>(query, params);
  },

  delete: async (id: string): Promise<void> => {
    const query = 'DELETE FROM Candidates WHERE id = @id';
    await executeQuery(query, { id });
  },
};

// AnalysisJob Queries
export const analysisJobQueries = {
  create: async (job: Omit<AnalysisJob, 'id' | 'createdAt' | 'updatedAt'>): Promise<AnalysisJob> => {
    const query = `
      INSERT INTO AnalysisJobs (id, candidateId, status, result, error, createdAt, updatedAt)
      OUTPUT INSERTED.*
      VALUES (NEWID(), @candidateId, @status, @result, @error, GETDATE(), GETDATE())
    `;
    const result = await executeScalar<AnalysisJob>(query, job);
    if (!result) throw new Error('Failed to create analysis job');
    return result;
  },

  findById: async (id: string): Promise<AnalysisJob | null> => {
    const query = 'SELECT * FROM AnalysisJobs WHERE id = @id';
    return await executeScalar<AnalysisJob>(query, { id });
  },

  findByCandidateId: async (candidateId: string): Promise<AnalysisJob[]> => {
    const query = 'SELECT * FROM AnalysisJobs WHERE candidateId = @candidateId ORDER BY createdAt DESC';
    return await executeQuery<AnalysisJob>(query, { candidateId });
  },

  updateStatus: async (id: string, status: string, result?: string, error?: string): Promise<AnalysisJob | null> => {
    const query = `
      UPDATE AnalysisJobs
      SET status = @status, result = @result, error = @error, updatedAt = GETDATE()
      OUTPUT INSERTED.*
      WHERE id = @id
    `;
    return await executeScalar<AnalysisJob>(query, { id, status, result, error });
  },

  getPendingJobs: async (): Promise<AnalysisJob[]> => {
    const query = "SELECT * FROM AnalysisJobs WHERE status = 'queued' ORDER BY createdAt ASC";
    return await executeQuery<AnalysisJob>(query);
  },
};

// JobDescription Queries
export const jobDescriptionQueries = {
  create: async (jd: Omit<JobDescription, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobDescription> => {
    const query = `
      INSERT INTO JobDescriptions (id, title, description, isActive, createdAt, updatedAt)
      OUTPUT INSERTED.*
      VALUES (NEWID(), @title, @description, @isActive, GETDATE(), GETDATE())
    `;
    const result = await executeScalar<JobDescription>(query, jd);
    if (!result) throw new Error('Failed to create job description');
    return result;
  },

  getAll: async (): Promise<JobDescription[]> => {
    const query = 'SELECT * FROM JobDescriptions ORDER BY createdAt DESC';
    return await executeQuery<JobDescription>(query);
  },

  getActive: async (): Promise<JobDescription[]> => {
    const query = 'SELECT * FROM JobDescriptions WHERE isActive = 1 ORDER BY createdAt DESC';
    return await executeQuery<JobDescription>(query);
  },

  updateStatus: async (id: string, isActive: boolean): Promise<JobDescription | null> => {
    const query = `
      UPDATE JobDescriptions
      SET isActive = @isActive, updatedAt = GETDATE()
      OUTPUT INSERTED.*
      WHERE id = @id
    `;
    return await executeScalar<JobDescription>(query, { id, isActive });
  },

  delete: async (id: string): Promise<boolean> => {
    const query = 'DELETE FROM JobDescriptions WHERE id = @id';
    await executeQuery(query, { id });
    return true;
  },
};
