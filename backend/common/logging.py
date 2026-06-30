import logging


def get_logger(name):
    """Return a logger configured by settings.LOGGING. Pass __name__ from the caller."""
    return logging.getLogger(name)
