from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None

    data = response.data
    if isinstance(data, dict):
        detail = data.get('detail', '')
        errors = {k: v for k, v in data.items() if k != 'detail'}
        if detail:
            message = str(detail)
        elif errors:
            first_val = list(errors.values())[0]
            message = str(first_val[0]) if isinstance(first_val, list) else str(first_val)
        else:
            message = str(exc)
    elif isinstance(data, list):
        message = str(data[0]) if data else str(exc)
        errors = {}
    else:
        message = str(data)
        errors = {}

    response.data = {'message': message}
    if errors:
        response.data['errors'] = errors

    return response
