from datetime import datetime
from flask import request, current_app
from flask_babel import get_locale

def getMonthName(month_number, locale=None):
    """
    Restituisce il nome del mese localizzato
    
    Args:
        month_number (int): Numero del mese (1-12)
        locale (str, optional): Locale specifico (es. 'it', 'en'). 
                                Se None, usa il locale della richiesta corrente
    
    Returns:
        str: Nome del mese localizzato
    """
    try:
        # Se non è specificato un locale, prova a ottenerlo dalla richiesta
        if locale is None:
            try:
                # Prova a ottenere il locale da Flask-Babel se disponibile
                locale = str(get_locale())
            except:
                # Fallback: usa il locale dalla richiesta HTTP
                locale = request.accept_languages.best_match(['it', 'en']) or 'it'
        
        # Crea una data fittizia per il mese richiesto
        date = datetime(2000, month_number, 1)
        
        # Usa babel per formattare il mese
        from babel.dates import format_date
        return format_date(date, format='MMMM', locale=locale).capitalize()
    
    except ImportError:
        # Se babel non è installato, usa il fallback
        return _getMonthName_fallback(month_number, locale)
    except:
        # Qualsiasi altro errore, usa il fallback
        return _getMonthName_fallback(month_number, locale)


def _getMonthName_fallback(month_number, locale='it'):
    """
    Fallback senza dipendenze esterne
    """
    months = {
        'it': {
            1: 'Gennaio', 2: 'Febbraio', 3: 'Marzo', 4: 'Aprile',
            5: 'Maggio', 6: 'Giugno', 7: 'Luglio', 8: 'Agosto',
            9: 'Settembre', 10: 'Ottobre', 11: 'Novembre', 12: 'Dicembre'
        },
        'en': {
            1: 'January', 2: 'February', 3: 'March', 4: 'April',
            5: 'May', 6: 'June', 7: 'July', 8: 'August',
            9: 'September', 10: 'October', 11: 'November', 12: 'December'
        }
    }
    
    # Normalizza il locale (prendi solo i primi 2 caratteri)
    locale = locale[:2].lower() if locale else 'it'
    
    # Se il locale non è supportato, usa italiano
    if locale not in months:
        locale = 'it'
    
    return months[locale].get(month_number, str(month_number))


def getMonthNameShort(month_number, locale=None):
    """
    Restituisce il nome del mese abbreviato (primi 3 caratteri)
    """
    return getMonthName(month_number, locale)[:3]