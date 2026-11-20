import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Chip,
  MessageContainer,
  ProgressCircle,
} from "@dynatrace/strato-components/content";
import { TextInput } from "@dynatrace/strato-components/forms";
import { Flex } from "@dynatrace/strato-components/layouts";
import {
  Heading,
  Paragraph,
  Text,
} from "@dynatrace/strato-components/typography";
import { useAppFunction } from "@dynatrace-sdk/react-hooks";
import Borders from "@dynatrace/strato-design-tokens/borders";
import Colors from "@dynatrace/strato-design-tokens/colors";
import { stripe } from "../lib/theme";
import type { GroupInfo } from "../lib/model";

type ListedGroup = Pick<
  GroupInfo,
  "uuid" | "name" | "owner" | "description" | "federatedAttributeValues"
>;

interface ListedUser {
  uid: string;
  email: string;
  name: string;
  surname: string;
  status: string;
}

const norm = (s: string) => s.trim().toLowerCase();

const panelBorder = `${Borders.Width.Default} solid ${Colors.Border.Neutral.Default}`;

const MembersPanel = ({
  group,
  onSelectMember,
}: {
  group: ListedGroup;
  onSelectMember: (email: string) => void;
}) => {
  const { data, error, isLoading } = useAppFunction({
    name: "list-group-members",
    data: { groupUuid: group.uuid },
  });
  const members = (data as { members: ListedUser[] } | undefined)?.members;

  return (
    <Flex flexDirection="column" gap={12}>
      <Flex alignItems="center" gap={8} flexWrap="wrap">
        <Heading level={3}>{group.name}</Heading>
        <Chip size="condensed">{group.owner}</Chip>
      </Flex>
      {group.description && <Text style={{ opacity: 0.7 }}>{group.description}</Text>}

      {isLoading && (
        <Flex alignItems="center" gap={8}>
          <ProgressCircle size="small" />
          <Text>Loading members…</Text>
        </Flex>
      )}
      {error && (
        <MessageContainer variant="critical">
          <MessageContainer.Title>Could not load members</MessageContainer.Title>
          <MessageContainer.Description>{error.message}</MessageContainer.Description>
        </MessageContainer>
      )}
      {members && members.length === 0 && (
        <Text style={{ opacity: 0.7 }}>No members found for this group.</Text>
      )}
      {members && members.length > 0 && (
        <>
          <Text style={{ opacity: 0.7 }}>{members.length} member{members.length !== 1 ? "s" : ""} · click to view permissions</Text>
          <div
            role="listbox"
            style={{
              border: panelBorder,
              borderRadius: Borders.Radius.Container.Default,
              overflow: "hidden",
              maxHeight: 500,
              overflowY: "auto",
            }}
          >
            {members.map((m, i) => (
              <button
                key={m.uid}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => onSelectMember(m.email)}
                style={{
                  ...stripe(i),
                  display: "flex",
                  width: "100%",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  border: "none",
                  cursor: "pointer",
                  font: "inherit",
                  color: "inherit",
                  textAlign: "left",
                }}
              >
                <span>
                  <strong>
                    {m.name} {m.surname}
                  </strong>
                  <br />
                  <span style={{ opacity: 0.7 }}>{m.email}</span>
                </span>
                {m.status && m.status !== "ACTIVE" && (
                  <Chip size="condensed" color="warning">
                    {m.status}
                  </Chip>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </Flex>
  );
};

export const GroupMembers = () => {
  const navigate = useNavigate();

  const { data, error, isLoading } = useAppFunction({
    name: "list-groups",
    data: {},
  });
  const groups = (data as { groups: ListedGroup[] } | undefined)?.groups;

  const [groupFilter, setGroupFilter] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<ListedGroup>();

  const visibleGroups = useMemo(() => {
    const q = norm(groupFilter);
    return (groups ?? []).filter(
      (g) => !q || norm(g.name).includes(q),
    );
  }, [groups, groupFilter]);

  const handleSelectMember = (email: string) => {
    navigate("/", { state: { email } });
  };

  return (
    <Flex flexDirection="column" padding={32} gap={16}>
      <Heading level={1}>Group Members</Heading>
      <Paragraph>
        Browse all Dynatrace groups and see who belongs to each one. Click a
        member to view their permissions in the User explorer.
      </Paragraph>

      {isLoading && <ProgressCircle />}
      {error && (
        <MessageContainer variant="critical">
          <MessageContainer.Title>Could not load groups</MessageContainer.Title>
          <MessageContainer.Description>{error.message}</MessageContainer.Description>
        </MessageContainer>
      )}

      {groups && (
        <Flex gap={24} alignItems="flex-start">
          {/* Left: group list */}
          <Flex
            flexDirection="column"
            gap={8}
            style={{ width: 320, flexShrink: 0 }}
          >
            <TextInput
              value={groupFilter}
              onChange={(v) => setGroupFilter(v ?? "")}
              placeholder={`Filter ${groups.length} groups`}
            />
            <Text style={{ opacity: 0.6 }}>
              {visibleGroups.length} group{visibleGroups.length !== 1 ? "s" : ""}
            </Text>
            <div
              role="listbox"
              style={{
                border: panelBorder,
                borderRadius: Borders.Radius.Container.Default,
                overflow: "hidden",
                maxHeight: 560,
                overflowY: "auto",
              }}
            >
              {visibleGroups.map((g, i) => {
                const isSelected = selectedGroup?.uuid === g.uuid;
                return (
                  <button
                    key={g.uuid}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => setSelectedGroup(g)}
                    style={{
                      ...(isSelected
                        ? {
                            background: Colors.Background.Container.Primary.Emphasized,
                            padding: "8px 16px",
                          }
                        : stripe(i)),
                      display: "flex",
                      width: "100%",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                      border: "none",
                      cursor: "pointer",
                      font: "inherit",
                      color: "inherit",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontWeight: isSelected ? 600 : undefined }}>
                      {g.name}
                    </span>
                    <Chip size="condensed">{g.owner}</Chip>
                  </button>
                );
              })}
            </div>
          </Flex>

          {/* Right: members panel */}
          <Flex
            flexDirection="column"
            gap={8}
            style={{
              flex: 1,
              minWidth: 0,
              borderLeft: panelBorder,
              paddingLeft: 24,
            }}
          >
            {!selectedGroup ? (
              <Text style={{ opacity: 0.6 }}>
                Select a group on the left to see its members.
              </Text>
            ) : (
              <MembersPanel
                key={selectedGroup.uuid}
                group={selectedGroup}
                onSelectMember={handleSelectMember}
              />
            )}
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};
