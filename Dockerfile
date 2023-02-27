FROM python:3.9

# Imposta la directory di lavoro all'interno del container
WORKDIR /app

COPY . /app

# Installa le dipendenze dell'applicazione
RUN pip install -e .

ENV APP_ENV=prod
ENV SERVER_PORT=8000

# Esegui l'applicazione quando il container è avviato
#CMD ["flask", "run"]

ENTRYPOINT [""]
CMD ["python", "/app/consumption_app/__init__.py"]
