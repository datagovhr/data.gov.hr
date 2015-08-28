import json

def has_certificate(pkg):
    """
    Can be used in the template to determine if the package has a
    certificate. Returns a boolean.
    """
    return 'odi-certificate' in pkg.extras

def get_certificate_data(pkg):
    """
    Returns the dictionary containing information about the certificate for the
    given package
    """
    return json.loads(pkg.extras.get('odi-certificate'))
