import { pool } from './client'

export async function runMigrations() {
  await pool.query(`
    -- ============================================================
    -- 1. Существующие таблицы (без изменений для обратной совместимости)
    -- ============================================================
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      utm_source TEXT,
      device TEXT,
      status TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('user', 'bot', 'manager')),
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID,
      contact_type TEXT,
      contact_value TEXT,
      apartment_params JSONB,
      estimate_min BIGINT,
      estimate_max BIGINT,
      selected_segment TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_session_id_fkey;

    CREATE TABLE IF NOT EXISTS estimates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
      params_json JSONB,
      result_json JSONB,
      pdf_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS work_types (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      unit TEXT,
      category TEXT
    );

    CREATE TABLE IF NOT EXISTS price_matrix (
      work_type_id INT REFERENCES work_types(id) ON DELETE CASCADE,
      segment TEXT NOT NULL,
      price_min NUMERIC,
      price_max NUMERIC,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(work_type_id, segment)
    );

    -- ============================================================
    -- 2. Multi-tenant: основная таблица тенантов
    -- ============================================================
    CREATE TABLE IF NOT EXISTS tenants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug VARCHAR(50) UNIQUE NOT NULL,
      company_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      city VARCHAR(100) DEFAULT 'Челябинск',
      plan VARCHAR(20) DEFAULT 'free',
      is_active BOOLEAN DEFAULT TRUE,
      is_verified BOOLEAN DEFAULT FALSE,
      logo_url VARCHAR(500),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_login_at TIMESTAMPTZ,
      trial_ends_at TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
    CREATE INDEX IF NOT EXISTS idx_tenants_email ON tenants(email);

    -- ============================================================
    -- 3. Настройки бота тенанта
    -- ============================================================
    CREATE TABLE IF NOT EXISTS tenant_bot_settings (
      tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
      bot_name VARCHAR(50) DEFAULT 'Макс',
      bot_avatar_url VARCHAR(500),
      tone VARCHAR(20) DEFAULT 'friendly',
      language VARCHAR(5) DEFAULT 'ru',
      welcome_message TEXT,
      quick_buttons JSONB DEFAULT '[]'::jsonb,
      system_prompt_override TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- ============================================================
    -- 4. Брендинг тенанта
    -- ============================================================
    CREATE TABLE IF NOT EXISTS tenant_branding (
      tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
      primary_color VARCHAR(7) DEFAULT '#22c55e',
      secondary_color VARCHAR(7) DEFAULT '#3b82f6',
      page_title VARCHAR(100),
      page_subtitle VARCHAR(255),
      hero_image_url VARCHAR(500),
      company_description TEXT,
      footer_text TEXT,
      favicon_url VARCHAR(500),
      meta_description VARCHAR(300),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- ============================================================
    -- 5. Сегменты ремонта тенанта
    -- ============================================================
    CREATE TABLE IF NOT EXISTS tenant_segments (
      id SERIAL PRIMARY KEY,
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(50) NOT NULL,
      description TEXT,
      what_included TEXT,
      price_range_min NUMERIC(10,2),
      price_range_max NUMERIC(10,2),
      typical_materials TEXT,
      sort_order INT DEFAULT 0,
      UNIQUE(tenant_id, name)
    );

    -- ============================================================
    -- 6. Поведение бота тенанта
    -- ============================================================
    CREATE TABLE IF NOT EXISTS tenant_bot_behavior (
      tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
      trigger_words JSONB DEFAULT '["дорого", "не устраивает", "менеджер"]'::jsonb,
      max_messages_without_cta INT DEFAULT 5,
      estimate_disclaimer TEXT,
      pdf_ttl_notice VARCHAR(200),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- ============================================================
    -- 7. Настройки интеграций тенанта
    -- ============================================================
    CREATE TABLE IF NOT EXISTS tenant_integrations (
      tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
      routerai_api_key VARCHAR(255),
      routerai_primary_model VARCHAR(50) DEFAULT 'gpt-4o',
      routerai_fallback_model VARCHAR(50) DEFAULT 'claude-3-5-sonnet',
      routerai_daily_token_limit INT DEFAULT 100000,
      telegram_bot_token VARCHAR(255),
      telegram_chat_id VARCHAR(50),
      telegram_notification_template TEXT,
      yandex_metrika_counter_id VARCHAR(20),
      yandex_metrika_events JSONB DEFAULT '{"chat_opened":true,"estimate_started":true,"estimate_completed":true,"lead_created":true}'::jsonb,
      amocrm_webhook_url VARCHAR(500),
      amocrm_api_key VARCHAR(255),
      amocrm_field_mapping JSONB DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- ============================================================
    -- 8. Пользователи тенанта (команда)
    -- ============================================================
    CREATE TABLE IF NOT EXISTS tenant_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(100),
      role VARCHAR(20) DEFAULT 'manager',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_login_at TIMESTAMPTZ,
      UNIQUE(tenant_id, email)
    );

    -- ============================================================
    -- 9. Суперадмин (владелец платформы)
    -- ============================================================
    CREATE TABLE IF NOT EXISTS platform_admins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(100),
      role VARCHAR(20) DEFAULT 'superadmin',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- ============================================================
    -- 10. Использование ресурсов (для биллинга/лимитов)
    -- ============================================================
    CREATE TABLE IF NOT EXISTS tenant_usage (
      id BIGSERIAL PRIMARY KEY,
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      month DATE NOT NULL,
      sessions_count INT DEFAULT 0,
      messages_count INT DEFAULT 0,
      leads_count INT DEFAULT 0,
      tokens_used BIGINT DEFAULT 0,
      pdf_generated INT DEFAULT 0,
      storage_bytes BIGINT DEFAULT 0,
      UNIQUE(tenant_id, month)
    );

    CREATE INDEX IF NOT EXISTS idx_tenant_usage_month ON tenant_usage(tenant_id, month);

    -- ============================================================
    -- 11. Аудит-лог
    -- ============================================================
    CREATE TABLE IF NOT EXISTS platform_audit_log (
      id BIGSERIAL PRIMARY KEY,
      actor_type VARCHAR(20) NOT NULL,
      actor_id UUID,
      tenant_id UUID REFERENCES tenants(id),
      action VARCHAR(50) NOT NULL,
      details JSONB,
      ip_address INET,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON platform_audit_log(tenant_id, created_at DESC);

    -- ============================================================
    -- 12. Добавить tenant_id в существующие таблицы (idempotent)
    -- ============================================================
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'tenant_id'
      ) THEN
        ALTER TABLE sessions ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX idx_sessions_tenant ON sessions(tenant_id, created_at DESC);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'tenant_id'
      ) THEN
        ALTER TABLE leads ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX idx_leads_tenant ON leads(tenant_id, created_at DESC);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'work_types' AND column_name = 'tenant_id'
      ) THEN
        ALTER TABLE work_types ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX idx_work_types_tenant ON work_types(tenant_id);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'estimates' AND column_name = 'tenant_id'
      ) THEN
        ALTER TABLE estimates ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'manual_rating'
      ) THEN
        ALTER TABLE sessions ADD COLUMN manual_rating VARCHAR(30);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'is_human_managed'
      ) THEN
        ALTER TABLE sessions ADD COLUMN is_human_managed BOOLEAN DEFAULT FALSE;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tenants' AND column_name = 'plan_expires_at'
      ) THEN
        ALTER TABLE tenants ADD COLUMN plan_expires_at TIMESTAMPTZ;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tenant_bot_settings' AND column_name = 'funnel_steps'
      ) THEN
        ALTER TABLE tenant_bot_settings ADD COLUMN funnel_steps JSONB;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tenants' AND column_name = 'custom_domain'
      ) THEN
        ALTER TABLE tenants ADD COLUMN custom_domain VARCHAR(255);
        ALTER TABLE tenants ADD COLUMN dns_status VARCHAR(20) DEFAULT 'pending';
        CREATE INDEX idx_tenants_domain ON tenants(custom_domain);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tenant_bot_settings' AND column_name = 'is_white_label'
      ) THEN
        ALTER TABLE tenant_bot_settings ADD COLUMN is_white_label BOOLEAN DEFAULT FALSE;
      END IF;
    END $$;

    -- ============================================================
    -- 13. База знаний тенанта (RAG)
    -- ============================================================
    CREATE TABLE IF NOT EXISTS tenant_knowledge_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      file_name VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_tenant_knowledge ON tenant_knowledge_documents(tenant_id, created_at DESC);

    -- ============================================================
    -- 15. Шаблоны ответов (Canned Responses)
    -- ============================================================
    CREATE TABLE IF NOT EXISTS tenant_canned_responses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      title VARCHAR(100) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_tenant_canned_responses ON tenant_canned_responses(tenant_id);
  `)
  console.log('Migrations complete')
}
