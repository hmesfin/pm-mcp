# Project Structure Reference

## Root Level Structure

```
project-root/
├── backend/              # Django backend
├── frontend/             # Vue.js frontend
├── mobile/              # React Native mobile app
├── compose/             # Docker service configurations
├── .envs/               # Environment variables
├── docs/                # Sphinx documentation
├── project-docs/        # Project-specific documentation
├── docker-compose.yml   # Local development compose file
├── docker-compose.production.yml
├── docker-compose.staging.yml
└── README.md
```

## Backend Structure (`backend/`)

```
backend/
├── apps/
│   ├── users/           # Custom User model (email-based)
│   ├── shared/          # Shared utilities, base classes
│   ├── <app_name>/      # Your Django apps go here
│   │   ├── __init__.py
│   │   ├── models.py    # Model definitions with type hints
│   │   ├── api/
│   │   │   ├── serializers.py
│   │   │   └── views.py # DRF ViewSets
│   │   ├── migrations/
│   │   ├── tests.py     # pytest tests
│   │   └── admin.py     # Django admin config
│   ├── templates/       # Email templates only
│   └── conftest.py      # pytest fixtures
├── config/
│   ├── settings/
│   │   ├── base.py      # Base settings
│   │   ├── local.py     # Development
│   │   ├── test.py      # Testing
│   │   └── production.py
│   ├── api_router.py    # DRF router (register ViewSets here)
│   ├── urls.py          # Root URL configuration
│   ├── asgi.py
│   ├── wsgi.py
│   └── celery_app.py
├── locale/              # i18n translations
├── manage.py
├── pyproject.toml       # Python dependencies (uv)
├── uv.lock
├── pytest.ini
└── .python-version
```

### Backend File Organization Principles

1. **Apps in `backend/apps/`**: All Django apps live here
2. **API endpoints in `api/` subdirectory**: Keeps API code separate
3. **No template views**: Django only serves API and admin
4. **Tests co-located**: `tests.py` or `tests/` directory per app
5. **Type hints everywhere**: All functions/methods typed

## Frontend Structure (`frontend/`)

```
frontend/
├── src/
│   ├── api/              # AUTO-GENERATED - DO NOT EDIT
│   │   ├── sdk.gen.ts    # Generated API functions
│   │   └── types.gen.ts  # Generated TypeScript types
│   ├── components/
│   │   ├── ui/           # Shadcn-vue components
│   │   └── <feature>/    # Domain components
│   │       ├── ComponentName.vue
│   │       └── __tests__/
│   │           └── ComponentName.test.ts
│   ├── composables/      # Vue composables
│   │   └── use<Feature>.ts
│   ├── stores/           # Pinia stores
│   ├── views/            # Route views
│   ├── router/           # Vue Router config
│   ├── layouts/          # Layout components
│   ├── lib/
│   │   ├── api-client.ts # Axios client with auth
│   │   └── utils.ts      # Utility functions
│   ├── schemas/          # Zod validation schemas
│   ├── constants/        # App constants
│   ├── types/            # Manual TypeScript types
│   ├── assets/           # Static assets
│   ├── App.vue
│   └── main.ts
├── public/               # Public static files
├── components.json       # Shadcn-vue config
├── package.json
├── tsconfig.json         # TypeScript config (strict mode)
├── vite.config.ts
├── tailwind.config.js
├── vitest.config.ts      # Test configuration
└── playwright.config.ts  # E2E test config
```

### Frontend File Organization Principles

1. **Never edit `src/api/`**: Auto-generated from backend OpenAPI schema
2. **Components by domain**: `components/<feature>/ComponentName.vue`
3. **Tests co-located**: `__tests__/` directories next to components
4. **Logic in composables**: Extract reusable logic to `composables/`
5. **Type everything**: No `any` types, strict TypeScript mode
6. **Max 500 lines**: Split large components into smaller ones
