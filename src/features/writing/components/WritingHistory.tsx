"use client";

import { Clock, FileText, ChevronRight, Trash2, Search } from "lucide-react";
import { useState } from "react";

import type { HistoryRecord } from "../types";

interface WritingHistoryProps {
  records: HistoryRecord[];
  onSelect: (record: HistoryRecord) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function WritingHistory({ records, onSelect, onDelete, onClose }: WritingHistoryProps) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? records.filter(
        (r) =>
          r.title.toLowerCase().includes(search.toLowerCase()) ||
          r.content.toLowerCase().includes(search.toLowerCase()),
      )
    : records;

  return (
    <div className="bg-card border rounded-xl p-4 space-y-3 animate-in slide-in-from-bottom-2 max-h-[60vh] flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          作文历史 ({records.length})
        </h3>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">
          关闭
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索作文..."
          className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border bg-background outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="overflow-y-auto flex-1 space-y-1">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
            {search ? "没有找到匹配的作文" : "还没有写作文"}
          </div>
        ) : (
          filtered.map((record) => (
            <div
              key={record.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
              onClick={() => onSelect(record)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{record.title || "未命名作文"}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>
                    {new Date(record.createdAt).toLocaleDateString("zh-CN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span>·</span>
                  <span>{record.wordCount} 词</span>
                  {record.score != null && (
                    <>
                      <span>·</span>
                      <span className="font-medium text-foreground">{record.score}分</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(record.id);
                  }}
                  className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </button>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
