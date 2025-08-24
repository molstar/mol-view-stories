import logging
import traceback

from error_handlers import APIError
from storage.client import handle_minio_error

logger = logging.getLogger(__name__)


@handle_minio_error("count_user_objects")
def count_user_sessions(user_id):
    """Count the number of sessions owned by a specific user.

    Args:
        user_id (str): The user ID to count sessions for

    Returns:
        int: Number of sessions owned by the user
    """
    try:
        # Import here to avoid circular import
        from storage.objects import list_objects_by_type

        # Count all sessions for this user (they're all private now)
        sessions = list_objects_by_type("session", user_id=user_id)

        total_count = len(sessions)
        logger.info(f"User {user_id} has {total_count} sessions")
        return total_count

    except Exception as e:
        logger.error(f"Error counting sessions for user {user_id}: {str(e)}")
        logger.error(f"Stack trace: {traceback.format_exc()}")
        # Return 0 on error to allow operations to continue, but log the issue
        return 0


@handle_minio_error("count_user_objects")
def count_user_stories(user_id):
    """Count the number of stories owned by a specific user.

    Args:
        user_id (str): The user ID to count stories for

    Returns:
        int: Number of stories owned by the user
    """
    try:
        # Import here to avoid circular import
        from storage.objects import list_objects_by_type

        # Count all stories for this user (they're all public now)
        stories = list_objects_by_type("story", user_id=user_id)

        total_count = len(stories)
        logger.info(f"User {user_id} has {total_count} stories")
        return total_count

    except Exception as e:
        logger.error(f"Error counting stories for user {user_id}: {str(e)}")
        logger.error(f"Stack trace: {traceback.format_exc()}")
        # Return 0 on error to allow operations to continue, but log the issue
        return 0


def check_user_session_limit(user_id, max_sessions):
    """Check if user has reached the session limit.

    Args:
        user_id (str): The user ID to check
        max_sessions (int): Maximum allowed sessions per user

    Returns:
        bool: True if under limit, False if at or over limit

    Raises:
        APIError: If the user has reached the session limit
    """
    current_count = count_user_sessions(user_id)

    if current_count >= max_sessions:
        raise APIError(
            f"Session limit reached. You have {current_count} sessions "
            f"(limit: {max_sessions}). Please delete some sessions before creating new ones.",
            status_code=429,  # Too Many Requests
            details={
                "current_count": current_count,
                "limit": max_sessions,
                "object_type": "session",
            },
        )

    logger.info(
        f"User {user_id} session count check passed: {current_count}/{max_sessions}"
    )
    return True


def check_user_story_limit(user_id, max_stories):
    """Check if user has reached the story limit.

    Args:
        user_id (str): The user ID to check
        max_stories (int): Maximum allowed stories per user

    Returns:
        bool: True if under limit, False if at or over limit

    Raises:
        APIError: If the user has reached the story limit
    """
    current_count = count_user_stories(user_id)

    if current_count >= max_stories:
        raise APIError(
            f"Story limit reached. You have {current_count} stories "
            f"(limit: {max_stories}). Please delete some stories before creating new ones.",
            status_code=429,  # Too Many Requests
            details={
                "current_count": current_count,
                "limit": max_stories,
                "object_type": "story",
            },
        )

    logger.info(
        f"User {user_id} story count check passed: {current_count}/{max_stories}"
    )
    return True
