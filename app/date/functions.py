def getMonthName(month_number):
    """
    Restituisce il nome del mese in italiano dato il numero
    
    Args:
        month_number (int): Numero del mese (1-12)
    
    Returns:
        str: Nome del mese in italiano
    """
    months = {
        1: 'Gennaio',
        2: 'Febbraio',
        3: 'Marzo',
        4: 'Aprile',
        5: 'Maggio',
        6: 'Giugno',
        7: 'Luglio',
        8: 'Agosto',
        9: 'Settembre',
        10: 'Ottobre',
        11: 'Novembre',
        12: 'Dicembre'
    }
    return months.get(month_number, str(month_number))