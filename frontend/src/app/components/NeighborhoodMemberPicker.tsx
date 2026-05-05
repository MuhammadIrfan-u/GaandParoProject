import { useState, useEffect } from "react";
import { Search, X, Users } from "lucide-react";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { getNeighborhoodMembers, MemberInfo } from "../services/eventsService";

interface NeighborhoodMemberPickerProps {
  neighborhoodId: number;
  currentUserId: number;
  selectedUserIds: number[];
  onSelectionChange: (userIds: number[]) => void;
}

export function NeighborhoodMemberPicker({
  neighborhoodId,
  currentUserId,
  selectedUserIds,
  onSelectionChange,
}: NeighborhoodMemberPickerProps) {
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadMembers();
  }, [neighborhoodId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await getNeighborhoodMembers(neighborhoodId);
      // Exclude the current user from the list
      setMembers(data.filter((m) => m.id !== currentUserId));
    } catch (error) {
      console.error("Failed to load members:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMember = (userId: number) => {
    if (selectedUserIds.includes(userId)) {
      onSelectionChange(selectedUserIds.filter((id) => id !== userId));
    } else {
      onSelectionChange([...selectedUserIds, userId]);
    }
  };

  const selectAll = () => {
    onSelectionChange(filteredMembers.map((m) => m.id));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">
          Invite Members
          {selectedUserIds.length > 0 && (
            <span className="ml-2 text-xs text-primary font-normal">
              ({selectedUserIds.length} selected)
            </span>
          )}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            All
          </button>
          <span className="text-xs text-muted-foreground">|</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-8"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Member List */}
      <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-white divide-y divide-border">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mr-2" />
            Loading members...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-sm text-muted-foreground">
            <Users className="w-8 h-8 mb-2 opacity-40" />
            {searchQuery ? "No members match your search" : "No members in this neighborhood"}
          </div>
        ) : (
          filteredMembers.map((member) => {
            const isSelected = selectedUserIds.includes(member.id);
            return (
              <label
                key={member.id}
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-muted/50 ${
                  isSelected ? "bg-primary/5" : ""
                }`}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleMember(member.id)}
                />
                <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-full w-8 h-8 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                  {member.avatar || getInitials(member.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{member.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{member.email}</div>
                </div>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                )}
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
