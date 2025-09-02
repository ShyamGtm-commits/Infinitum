from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.http import JsonResponse

def me(request):
    u = request.user
    if not u.is_authenticated:
        return JsonResponse({'detail': 'Unauthorized'}, status=401)
    return JsonResponse({
        'id': u.id,
        'username': u.username,
        'email': u.email,
        'groups': list(u.groups.values_list('name', flat=True)),
    })

urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', me, name='me'),
]
