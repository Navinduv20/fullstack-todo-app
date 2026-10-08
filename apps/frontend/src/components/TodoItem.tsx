import { useState } from 'react';
import { Button, Checkbox, Flex, Stack, Text, Theme } from '@chakra-ui/react';
import type { Todo, TodoValues } from '@todo/shared';
import { isTemp } from '../hooks/useTodos';
import { TodoForm } from './TodoForm';
import { strings } from '../utils/strings';

interface Props {
  todo: Todo;
  onToggle: (id: string) => void;
  onUpdate: (id: string, input: TodoValues) => void;
  onDelete: (todo: Todo) => void;
}

// "9:30 AM" for tasks added today, "8 Oct" for older ones.
function formatAdded(iso: string) {
  const date = new Date(iso);
  return date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

export function TodoItem({ todo, onToggle, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  // no server id yet, so toggle/edit/delete have nothing to send
  const pending = isTemp(todo.id);

  if (editing) {
    return (
      <Theme
        appearance="light"
        colorPalette="brand"
        bg="surface"
        borderRadius="2xl"
        boxShadow="lg"
        p="4"
      >
        <TodoForm
          defaultValues={{ title: todo.title, description: todo.description }}
          submitLabel={strings.form.save}
          autoFocus
          onCancel={() => setEditing(false)}
          onSubmit={(values) => {
            onUpdate(todo.id, values);
            setEditing(false);
          }}
        />
      </Theme>
    );
  }

  return (
    <Flex
      align="flex-start"
      gap="2"
      px="3"
      py="3"
      mx="-3"
      borderRadius="2xl"
      opacity={pending ? 0.6 : 1}
      transition="background-color 0.15s, opacity 0.15s"
      _hover={{ bg: 'navy.600' }}
    >
      <Checkbox.Root
        colorPalette="accent"
        checked={todo.done}
        disabled={pending}
        onCheckedChange={() => onToggle(todo.id)}
        flex="1"
        minW="0"
        alignItems="flex-start"
        gap="3"
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control mt="0.5" borderRadius="full" borderColor="fg.muted" />
        <Checkbox.Label
          minW="0"
          flex="1"
          fontWeight="normal"
          opacity={todo.done ? 0.6 : 1}
          transition="opacity 0.2s"
        >
          <Text
            fontWeight="medium"
            wordBreak="break-word"
            textDecoration={todo.done ? 'line-through' : 'none'}
          >
            {todo.title}
          </Text>
          {todo.description && (
            <Text
              mt="0.5"
              textStyle="xs"
              color="fg.muted"
              whiteSpace="pre-wrap"
              wordBreak="break-word"
            >
              {todo.description}
            </Text>
          )}
        </Checkbox.Label>
      </Checkbox.Root>
      <Stack gap="0" align="flex-end" flexShrink="0">
        <Text
          textStyle="xs"
          color="fg.muted"
          title={strings.item.added(new Date(todo.createdAt).toLocaleString())}
        >
          {formatAdded(todo.createdAt)}
        </Text>
        <Flex mr="-2">
          <Button
            size="2xs"
            variant="ghost"
            color="accent.fg"
            disabled={pending}
            aria-label={strings.item.editLabel(todo.title)}
            onClick={() => setEditing(true)}
          >
            {strings.item.edit}
          </Button>
          <Button
            size="2xs"
            variant="ghost"
            color="fg.muted"
            disabled={pending}
            aria-label={strings.item.deleteLabel(todo.title)}
            onClick={() => onDelete(todo)}
          >
            {strings.item.delete}
          </Button>
        </Flex>
      </Stack>
    </Flex>
  );
}
