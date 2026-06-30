from django.http import StreamingHttpResponse
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    ChatSessionDetailSerializer,
    ChatSessionListSerializer,
    CreateSessionSerializer,
    SendMessageSerializer,
)
from .services import ChatService


class ChatSessionListController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = ChatService.get_sessions(request.user.id)
        return Response(ChatSessionListSerializer(sessions, many=True).data)

    def post(self, request):
        serializer = CreateSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            session = ChatService.create_session(
                owner=request.user,
                **serializer.validated_data,
            )
        except ValueError as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            ChatSessionDetailSerializer(session).data,
            status=status.HTTP_201_CREATED,
        )


class ChatSessionDetailController(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        try:
            session = ChatService.get_session(session_id, request.user)
        except ValueError as e:
            return Response({'message': str(e)}, status=status.HTTP_404_NOT_FOUND)
        except PermissionError as e:
            return Response({'message': str(e)}, status=status.HTTP_403_FORBIDDEN)

        return Response(ChatSessionDetailSerializer(session).data)

    def delete(self, request, session_id):
        try:
            ChatService.delete_session(session_id, request.user)
        except ValueError as e:
            return Response({'message': str(e)}, status=status.HTTP_404_NOT_FOUND)
        except PermissionError as e:
            return Response({'message': str(e)}, status=status.HTTP_403_FORBIDDEN)

        return Response(status=status.HTTP_204_NO_CONTENT)


class ChatMessageController(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not ChatService.is_ai_configured():
            return Response(
                {'message': 'Gemini API key is not configured.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            ChatService.get_session(session_id, request.user)
        except ValueError as e:
            return Response({'message': str(e)}, status=status.HTTP_404_NOT_FOUND)
        except PermissionError as e:
            return Response({'message': str(e)}, status=status.HTTP_403_FORBIDDEN)

        response = StreamingHttpResponse(
            ChatService.stream_message(
                session_id=session_id,
                user=request.user,
                content=serializer.validated_data['content'],
                mentioned_user_ids=serializer.validated_data['mentioned_user_ids'],
                mentioned_product_ids=serializer.validated_data['mentioned_product_ids'],
            ),
            content_type='text/event-stream',
        )
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response
