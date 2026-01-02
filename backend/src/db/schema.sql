-- Architecture: Experiments -> Steps (1:N)

CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY,
  algorithm TEXT NOT NULL,
  params JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS steps (
  id SERIAL PRIMARY KEY,
  experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
  step_no INT NOT NULL,
  state JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS metrics (
  experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
  execution_time_ms INT,
  steps_count INT
);
