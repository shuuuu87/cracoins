import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMyMessages, useSendMessage, useMarkMessagesRead } from "@/hooks/use-messages";
import { useAuth } from "@/hooks/use-auth";
import { Send, MessageSquare, Loader2 } from "lucide-react";
import type { Message } from "@shared/schema";

function formatTime(ts: string | Date | null | undefined) {
  if (!ts) return "";
  return new Date(ts as string).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function SupportChat() {
  const { user } = useAuth();
  const { data: msgs, isLoading } = useMyMessages();
  const sendMessage = useSendMessage();
  const markRead = useMarkMessagesRead();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  useEffect(() => {
    markRead.mutate();
  }, []);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    try {
      await sendMessage.mutateAsync(trimmed);
    } catch (_) {}
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-3 p-1 min-h-[260px] max-h-[380px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !msgs || msgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">No messages yet</p>
              <p className="text-muted-foreground text-xs mt-1 max-w-[220px]">
                Send a message to the admin team. We'll get back to you as soon as possible.
              </p>
            </div>
          </div>
        ) : (
          msgs.map((msg: Message) => (
            <div
              key={msg.id}
              className={`flex ${msg.fromAdmin ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.fromAdmin
                    ? "bg-muted/50 border border-border/50 text-foreground rounded-tl-sm"
                    : "bg-primary text-white rounded-tr-sm"
                }`}
              >
                {msg.fromAdmin && (
                  <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">
                    Admin
                  </div>
                )}
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <div className={`text-[10px] mt-1 ${msg.fromAdmin ? "text-muted-foreground" : "text-white/70"}`}>
                  {formatTime(msg.createdAt)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border/50 pt-3 mt-3 space-y-2">
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message or complaint… (Enter to send)"
          className="resize-none text-sm min-h-[70px] max-h-[120px]"
          data-testid="input-support-message"
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">Press Enter to send · Shift+Enter for new line</p>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            className="gap-1.5"
            data-testid="button-send-message"
          >
            {sendMessage.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
