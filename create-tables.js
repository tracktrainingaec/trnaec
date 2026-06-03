// Rode: node create-tables.js <SERVICE_ROLE_KEY>
const SERVICE_KEY = process.argv[2];

if (!SERVICE_KEY) {
  console.error('Uso: node create-tables.js <service_role_key>');
  process.exit(1);
}

const PROJECT_URL = 'https://myfgfnyhthkicouwcoxs.supabase.co';

async function run() {
  const sql = `
    CREATE TABLE IF NOT EXISTS project_name_votes (
      id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
      option_name text        NOT NULL CHECK (option_name IN ('farol-aec', 'farol-rh', 'rota-aec', 'rota-rh')),
      voter_id    text        NOT NULL,
      created_at  timestamptz DEFAULT now(),
      UNIQUE (voter_id)
    );

    ALTER TABLE project_name_votes ENABLE ROW LEVEL SECURITY;

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'project_name_votes' AND policyname = 'anon_insert'
      ) THEN
        CREATE POLICY anon_insert ON project_name_votes
          FOR INSERT TO anon WITH CHECK (true);
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'project_name_votes' AND policyname = 'anon_select'
      ) THEN
        CREATE POLICY anon_select ON project_name_votes
          FOR SELECT TO anon USING (true);
      END IF;
    END $$;
  `;

  const res = await fetch(`${PROJECT_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  }).catch(() => null);

  // Tenta via endpoint SQL direto do Supabase Management API
  const res2 = await fetch(`https://api.supabase.com/v1/projects/myfgfnyhthkicouwcoxs/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  if (res2.ok) {
    console.log('✅ Tabelas criadas com sucesso!');
    console.log('Abra votacao-nome-projeto.html no navegador.');
  } else {
    const err = await res2.text();
    console.error('❌ Erro:', err);
    console.log('\nAlternativa: cole o SQL abaixo no Supabase Dashboard → SQL Editor:\n');
    console.log(sql);
  }
}

run();
