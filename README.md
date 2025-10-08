# Flask App with Docker and Alembic

Template for a Flask application with PostgreSQL, Docker and Alembic for migration management.

## 🚀 Quick Start

### Project Initialization

```bash
# 1. Initialize the project (creates .env and migrations directory)
make init

# 2. Edit the .env file with your configurations

# 3. Build and start the containers
make build
make up

# 4. Create the first migration
make migrate MSG="initial migration"

# 5. Apply the migrations
make upgrade
```

### Main Commands

```bash
make help       # Show all available commands
make dev        # Start in development mode with logs
make ps         # Show container status
make logs       # View application logs
make shell      # Open a shell in the container
make restart    # Restart containers
make down       # Stop containers
```

## 📦 Database and Migration Management

### Creating a New Migration

```bash
# After modifying models in app/models.py
make migrate MSG="add email field to User"
```

### Applying Migrations

```bash
make upgrade
```

### Rolling Back a Migration

```bash
make downgrade
```

### Checking Migration Status

```bash
make migrate-status   # Current status
make migrate-history  # Complete history
```

### Accessing the Database

```bash
make shell-db  # Open PostgreSQL shell
```

### Complete Database Reset (⚠️ WARNING!)

```bash
make db-reset  # Delete everything and recreate
```

## 📁 Project Structure

```
.
├── app/
│   ├── __init__.py          # Flask app initialization
│   ├── models.py            # SQLAlchemy models
│   ├── routes.py            # Application routes
│   └── migrations/          # Alembic migrations
│       ├── env.py           # Alembic configuration
│       ├── script.py.mako   # Template for new migrations
│       └── versions/        # Migration files
├── docker-compose.yml       # Docker configuration
├── Dockerfile               # Docker image
├── entrypoint.sh           # Startup script
├── requirements.txt        # Python dependencies
├── alembic.ini             # Alembic configuration
├── Makefile                # Management commands
├── .env                    # Environment variables (don't commit!)
└── .env.example            # Environment variables template
```

## 🔧 Configuration

### Environment Variables (.env)

```bash
# Flask
FLASK_ENV=development
SECRET_KEY=your-secret-key
APP_PORT=8000
APP_ENV=dev

# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=myapp_db
POSTGRES_PORT=5432

# Database URL
DATABASE_URL=postgresql://postgres:postgres@db:5432/myapp_db
```

## 📝 Typical Development Workflow

1. **Modify the models** in `app/models.py`
2. **Create a migration**: `make migrate MSG="description"`
3. **Apply the migration**: `make upgrade`
4. **Test the changes**: visit http://localhost:8000

## 🛠️ Troubleshooting

### Containers Won't Start

```bash
# Check the logs
make logs-all

# Rebuild the images
make clean
make build
make up
```

### Migration Issues

```bash
# Check the status
make migrate-status

# If necessary, complete reset
make db-reset
```

### Database Access Denied

Verify that the credentials in `.env` are correct and that the database container is running (`make ps`).

## 🧹 Cleanup

```bash
make clean      # Remove containers and images
make clean-all  # Also remove database data
```

## 📚 Useful Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Docker Documentation](https://docs.docker.com/)
