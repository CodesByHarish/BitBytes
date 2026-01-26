import { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import './CommentSection.css';

const CommentSection = ({ entityId, entityType, currentUser }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState(null); // Comment object
    const [loading, setLoading] = useState(false);
    const [hoveredComment, setHoveredComment] = useState(null);

    const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

    useEffect(() => {
        fetchComments();
    }, [entityId]);

    const fetchComments = async () => {
        try {
            setLoading(true);
            const { data } = await authAPI.getComments(entityType, entityId);
            setComments(data);
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const { data } = await authAPI.addComment({
                content: newComment,
                entityId,
                entityType,
                parentId: replyTo?._id || null
            });
            setComments([...comments, data]);
            setNewComment('');
            setReplyTo(null);
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to post comment');
        }
    };

    const handleReact = async (commentId, emoji) => {
        try {
            const { data } = await authAPI.reactToComment(commentId, emoji);
            setComments(comments.map(c =>
                c._id === commentId ? { ...c, reactions: data.reactions } : c
            ));
        } catch (error) {
            console.error('Error reacting to comment:', error);
        }
    };

    const getInitials = (email) => {
        return email ? email.split('@')[0].slice(0, 2).toUpperCase() : '??';
    };

    // Helper to render threaded comments
    const renderCommentThread = (parentId = null, depth = 0) => {
        return comments
            .filter(c => String(c.parentId) === String(parentId))
            .map(c => (
                <div
                    key={c._id}
                    className="comment-item"
                    style={{ marginLeft: depth > 0 ? '1.5rem' : '0', borderLeft: depth > 0 ? '2px solid rgba(255,255,255,0.05)' : 'none' }}
                    onMouseEnter={() => setHoveredComment(c._id)}
                    onMouseLeave={() => setHoveredComment(null)}
                >
                    <div className="comment-main">
                        <div className="comment-header">
                            <div className="comment-author">
                                <span className="author-avatar">{getInitials(c.author?.email)}</span>
                                <div className="author-info-stack">
                                    <span className="author-email">
                                        {c.author?.email}
                                    </span>
                                    <div className="author-badges">
                                        {c.author?.role === 'student' && (
                                            <span className="badge student-badge">[STUDENT]</span>
                                        )}
                                        {c.author?.role === 'management' && (
                                            <>
                                                {c.author?.isAdmin ? (
                                                    <span className="badge superadmin-badge">[SUPERADMIN]</span>
                                                ) : (
                                                    <span className={`badge ${c.author?.managementRole === 'subadmin' ? 'subadmin-badge' : 'management-badge'}`}>
                                                        [{c.author?.managementRole?.toUpperCase() || 'STAFF'}]
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="comment-body-wrapper">
                            <div className="comment-content">{c.content}</div>

                            {/* Emoji Reaction Bar (Visible on hover) */}
                            {hoveredComment === c._id && (
                                <div className="emoji-reaction-bar">
                                    {QUICK_EMOJIS.map(emoji => (
                                        <button
                                            key={emoji}
                                            className="emoji-btn"
                                            onClick={() => handleReact(c._id, emoji)}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Displayed active reactions */}
                            {c.reactions?.length > 0 && (
                                <div className="comment-active-reactions">
                                    {c.reactions.map(r => (
                                        <div
                                            key={r.emoji}
                                            className={`reaction-pill ${r.users.includes(currentUser.id) ? 'my-reaction' : ''}`}
                                            onClick={() => handleReact(c._id, r.emoji)}
                                        >
                                            {r.emoji} {r.users.length}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="comment-footer">
                            <span className="comment-date">
                                {new Date(c.createdAt).toLocaleDateString()} at {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button className="reply-btn" onClick={() => {
                                setReplyTo(c);
                                setTimeout(() => document.getElementById('comment-input')?.focus(), 0);
                            }}>
                                Reply
                            </button>
                        </div>
                    </div>
                    {/* Only support one level of nesting for visual clarity */}
                    {depth < 1 && renderCommentThread(c._id, depth + 1)}
                </div>
            ));
    };

    return (
        <div className="comment-section">
            <h4>💬 Community Discussion</h4>

            <div className="comments-list-container">
                {loading ? <p>Loading discussion...</p> : renderCommentThread()}
                {comments.length === 0 && !loading && <span className="no-comments">No discussion yet. Be the first to chime in!</span>}
            </div>

            <form onSubmit={handleAddComment} className="comment-form-box">
                {replyTo && (
                    <div className="replying-to">
                        Replying to <strong>{replyTo.author?.email}</strong>
                        <button type="button" onClick={() => setReplyTo(null)}>×</button>
                    </div>
                )}
                <div className="input-group">
                    <textarea
                        id="comment-input"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
                        required
                    />
                    <button type="submit" className="send-comment-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CommentSection;
