"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useQueryStates, parseAsBoolean, parseAsString } from "nuqs";
import { Sparkles, X, ArrowUp } from "lucide-react";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrainCircuit } from "lucide-react";

const SUGGESTED_MESSAGES = [
  "Monte meu plano de treino",
  "Estou com dor hoje, pode ajustar meu treino?",
];

const chatFormSchema = z.object({
  message: z.string().min(1),
});

type ChatFormValues = z.infer<typeof chatFormSchema>;

interface ChatProps {
  embedded?: boolean;
  initialMessage?: string;
}

export function Chat({ embedded = false, initialMessage }: ChatProps) {
  const [chatParams, setChatParams] = useQueryStates({
    chat_open: parseAsBoolean.withDefault(false),
    chat_initial_message: parseAsString,
    ai_provider: parseAsString.withDefault("google"),
  });

  const baseUrl = typeof window !== "undefined" 
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081")
    : (process.env.INTERNAL_API_URL || "http://backend:8081");

  // Log para debug no navegador
  console.log("Provedor atual no componente:", chatParams.ai_provider);

  const { messages, sendMessage, status, error } = useChat({
    // A chave força o React a destruir e recriar o chat ao trocar de IA
    key: `ai-${chatParams.ai_provider}`, 
    transport: new DefaultChatTransport({
      // Passamos o provedor na URL para não ter erro
      api: `${baseUrl}/ai?provider=${chatParams.ai_provider}`,
      credentials: "include",
    }),
  });

  useEffect(() => {
    console.log("Chat Status:", status);
    if (error) console.error("Chat Error:", error);
  }, [status, error]);

  const form = useForm<ChatFormValues>({
    resolver: zodResolver(chatFormSchema),
    defaultValues: { message: "" },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialMessageSentRef = useRef(false);

  useEffect(() => {
    if (embedded && initialMessage && !initialMessageSentRef.current) {
      initialMessageSentRef.current = true;
      sendMessage({ text: initialMessage });
    }
  }, [embedded, initialMessage, sendMessage]);

  useEffect(() => {
    if (
      !embedded &&
      chatParams.chat_open &&
      chatParams.chat_initial_message &&
      !initialMessageSentRef.current
    ) {
      initialMessageSentRef.current = true;
      sendMessage({ text: chatParams.chat_initial_message });
      setChatParams({ chat_initial_message: null });
    }
  }, [
    embedded,
    chatParams.chat_open,
    chatParams.chat_initial_message,
    sendMessage,
    setChatParams,
  ]);

  useEffect(() => {
    if (!embedded && !chatParams.chat_open) {
      initialMessageSentRef.current = false;
    }
  }, [embedded, chatParams.chat_open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const router = useRouter();

  if (!embedded && !chatParams.chat_open) return null;

  const handleClose = () => {
    setChatParams({ chat_open: false, chat_initial_message: null });
    router.refresh();
  };

  const onSubmit = (values: ChatFormValues) => {
    sendMessage({ text: values.message });
    form.reset();
  };

  const handleSuggestion = (text: string) => {
    sendMessage({ text });
  };

  const isStreaming = status === "streaming";
  const isLoading = status === "submitted" || isStreaming;

  const chatContent = (
    <div
      className={
        embedded
          ? "flex h-svh flex-col bg-background"
          : "flex flex-1 flex-col overflow-hidden rounded-[20px] bg-background"
      }
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border p-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-full bg-primary/8 border border-primary/8 p-3">
            <Sparkles className="size-[18px] text-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-heading text-base font-semibold text-foreground">
              Coach AI
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-online" />
                <span className="font-heading text-[10px] text-primary">Online</span>
              </div>
              
              {/* Seletor de Modelo */}
              <div className="flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5">
                <BrainCircuit className="size-3 text-muted-foreground" />
                <select 
                  value={chatParams.ai_provider}
                  onChange={(e) => setChatParams({ ai_provider: e.target.value })}
                  className="bg-transparent font-heading text-[10px] text-muted-foreground focus:outline-none"
                >
                  <option value="groq">Llama (Groq)</option>
                  <option value="google">Gemini</option>
                  <option value="openai">GPT-4o</option>
                  <option value="xai">Grok</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        {embedded ? (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Acessar FIT.AI</Link>
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="size-6 text-foreground" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-5">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "assistant"
                ? "flex flex-col items-start pl-5 pr-[60px] pt-5"
                : "flex flex-col items-end pl-[60px] pr-5 pt-5"
            }
          >
            <div
              className={
                message.role === "assistant"
                  ? "rounded-xl bg-secondary p-3"
                  : "rounded-xl bg-primary p-3"
              }
            >
              {message.role === "assistant" ? (
                message.parts.map((part, index) =>
                  part.type === "text" ? (
                    <Streamdown
                      key={index}
                      isAnimating={
                        isStreaming &&
                        messages[messages.length - 1]?.id === message.id
                      }
                      className="font-heading text-sm leading-relaxed text-foreground"
                    >
                      {part.text}
                    </Streamdown>
                  ) : null,
                )
              ) : (
                <p className="font-heading text-sm leading-relaxed text-primary-foreground">
                  {message.parts
                    .filter((part) => part.type === "text")
                    .map(
                      (part) => (part as { type: "text"; text: string }).text,
                    )
                    .join("")}
                </p>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex shrink-0 flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex gap-2.5 overflow-x-auto px-5">
            {SUGGESTED_MESSAGES.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestion(suggestion)}
                className="whitespace-nowrap rounded-full bg-primary/10 px-4 py-2 font-heading text-sm text-foreground"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex items-center gap-2 border-t border-border p-5"
          >
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Digite sua mensagem"
                      className="rounded-full border-border bg-secondary px-4 py-3 font-heading text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={!form.watch("message").trim() || isLoading}
              size="icon"
              className="size-[42px] shrink-0 rounded-full"
            >
              <ArrowUp className="size-5" />
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );

  if (embedded) return chatContent;

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-foreground/30"
        onClick={handleClose}
      />

      <div className="absolute inset-x-4 bottom-4 top-40 flex flex-col">
        {chatContent}
      </div>
    </div>
  );
}
