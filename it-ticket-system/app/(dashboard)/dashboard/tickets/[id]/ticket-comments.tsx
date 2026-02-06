'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Send, Lock } from 'lucide-react';
import { formatRelativeTime, getInitials } from '@/lib/utils';

// Types
interface Profile {
  id: string;
  organization_id: string | null;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: 'owner' | 'admin' | 'agent' | 'requester';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Comment {
  id: string;
  ticket_id: string;
  user_id: string | null;
  message: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  // Joined profile data
  user_profile?: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url' | 'role'> | null;
}

interface TicketCommentsProps {
  ticketId: string;
  comments: Comment[];
  currentUserId: string;
  currentUserRole: string;
  isInternal: boolean;
}

export function TicketComments({
  ticketId,
  comments,
  currentUserId,
  currentUserRole,
  isInternal,
}: TicketCommentsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { error: commentError } = await supabase
        .from('comments')
        .insert({
          ticket_id: ticketId,
          user_id: currentUserId,
          message: newComment.trim(),
          is_internal: isInternalComment && isInternal,
        });

      if (commentError) {
        setError(commentError.message);
        return;
      }

      // Create activity log
      await supabase.from('ticket_activity_logs').insert({
        ticket_id: ticketId,
        user_id: currentUserId,
        action: 'commented',
        new_value: newComment.trim().slice(0, 100),
      });

      setNewComment('');
      setIsInternalComment(false);
      router.refresh();
    } catch {
      setError('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Send className="w-5 h-5" />
          Comments
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {comments.length} comment{comments.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Comments list */}
      <div className="divide-y divide-slate-100">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-4 ${comment.is_internal ? 'bg-yellow-50/50' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-white">
                    {comment.user_profile?.full_name
                      ? getInitials(comment.user_profile.full_name)
                      : 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-900">
                      {comment.user_profile?.full_name || 'Unknown'}
                    </span>
                    {comment.is_internal && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                        <Lock className="w-3 h-3" />
                        Internal
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {formatRelativeTime(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap">{comment.message}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <p className="text-slate-500">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>

      {/* Comment form */}
      <div className="p-4 border-t border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}

          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="input min-h-[100px] resize-y"
            disabled={loading}
          />

          {isInternal && (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={isInternalComment}
                onChange={(e) => setIsInternalComment(e.target.checked)}
                className="rounded border-slate-300 text-primary focus:ring-primary"
              />
              <Lock className="w-4 h-4" />
              Internal note (only visible to staff)
            </label>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Post Comment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

