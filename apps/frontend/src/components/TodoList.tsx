import {
  Alert,
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Progress,
  Skeleton,
  Stack,
  Text,
  Theme,
} from '@chakra-ui/react';
import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import type { Todo } from '@todo/shared';
import { toUserMessage } from '../api/todos';
import {
  stableKey,
  useTodos,
  useToggleTodo,
  useUndoableDelete,
  useUpdateTodo,
} from '../hooks/useTodos';
import { TodoItem } from './TodoItem';
import { strings } from '../utils/strings';

function SectionHeading({ children, count }: { children: ReactNode; count: number }) {
  return (
    <Flex align="center" gap="2" mb="2">
      <Heading as="h2" size="md">
        {children}
      </Heading>
      <Badge bg="sky.soft" color="navy" borderRadius="full">
        {count}
      </Badge>
    </Flex>
  );
}

export function TodoList() {
  const todos = useTodos();
  const toggle = useToggleTodo();
  const update = useUpdateTodo();
  const { hiddenIds, requestDelete } = useUndoableDelete();

  const visible = (todos.data ?? []).filter((t) => !hiddenIds.has(t.id));
  const active = visible.filter((t) => !t.done);
  const completed = visible.filter((t) => t.done);

  const renderItems = (items: Todo[]) => (
    <Stack as="ul" gap="1" listStyleType="none">
      <AnimatePresence initial={false}>
        {items.map((todo) => (
          <motion.li
            key={stableKey(todo.id)}
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <TodoItem
              todo={todo}
              onToggle={toggle.mutate}
              onUpdate={(id, input) => update.mutate({ id, input })}
              onDelete={requestDelete}
            />
          </motion.li>
        ))}
      </AnimatePresence>
    </Stack>
  );

  let body: ReactNode;
  if (todos.isPending) {
    body = (
      <Stack gap="3" aria-label={strings.list.loading}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} h="12" borderRadius="2xl" bg="navy.600" />
        ))}
      </Stack>
    );
  } else if (todos.isError) {
    body = (
      <Theme appearance="light" colorPalette="brand" hasBackground={false}>
        <Alert.Root status="error" bg="surface" color="danger" borderRadius="2xl">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{strings.list.loadFailed}</Alert.Title>
            <Alert.Description>{toUserMessage(todos.error)}</Alert.Description>
          </Alert.Content>
          <Button size="sm" borderRadius="full" onClick={() => void todos.refetch()}>
            {strings.list.retry}
          </Button>
        </Alert.Root>
      </Theme>
    );
  } else if (visible.length === 0) {
    body = (
      <Box p="8" bg="sky.soft" color="navy" borderRadius="2xl" textAlign="center">
        <Text>{strings.list.empty}</Text>
      </Box>
    );
  } else {
    body = (
      <Stack gap="7">
        {active.length > 0 && (
          <Box as="section">
            <SectionHeading count={active.length}>{strings.list.todo}</SectionHeading>
            {renderItems(active)}
          </Box>
        )}
        {completed.length > 0 && (
          <Box as="section">
            <SectionHeading count={completed.length}>{strings.list.completed}</SectionHeading>
            {renderItems(completed)}
          </Box>
        )}
      </Stack>
    );
  }

  return (
    <>
      <Box as="header" px="7" pt="7" pb="6">
        <Heading as="h1" size="3xl" letterSpacing="tight">
          {strings.list.heading}
        </Heading>
        <Text color="fg.muted">
          {new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        {visible.length > 0 && (
          <Progress.Root
            colorPalette="accent"
            variant="subtle"
            size="sm"
            mt="4"
            value={completed.length}
            max={visible.length}
          >
            <Progress.Label mb="1.5" textStyle="xs" color="fg.muted" fontWeight="normal">
              {strings.list.progress(completed.length, visible.length)}
            </Progress.Label>
            <Progress.Track borderRadius="full">
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        )}
      </Box>
      <Theme
        appearance="dark"
        colorPalette="brand"
        bg="navy"
        borderTopRadius="4xl"
        flex="1"
        px="7"
        py="8"
      >
        {body}
      </Theme>
    </>
  );
}
