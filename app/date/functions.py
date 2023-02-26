import calendar
import os


def getMonthName(month_number):
    locale = os.getenv('LANG', 'en_US').split('.')[0]
    if locale == 'it_IT':
        months = ['', 'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre',
                  'Ottobre', 'Novembre', 'Dicembre']

        return months[month_number]
    else:
        return calendar.month_name[month_number]
