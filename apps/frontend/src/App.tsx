import { Box, Container, Heading, SimpleGrid } from '@chakra-ui/react';
import { MotionConfig } from 'motion/react';
import { TodoForm } from './components/TodoForm';
import { TodoList } from './components/TodoList';
import { useCreateTodo } from './hooks/useTodos';
import { strings } from './utils/strings';

const card = { bg: 'surface', borderRadius: '4xl', boxShadow: 'xl', overflow: 'hidden' } as const;

export default function App() {
  const createTodo = useCreateTodo();

  return (
    <MotionConfig reducedMotion="user">
      <Container as="main" maxW="4xl" py={{ base: '6', md: '12' }}>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="8" alignItems="start">
          <Box as="section" aria-label={strings.form.sectionLabel} {...card}>
            <Heading as="h2" size="xl" px="7" pt="7" pb="5">
              {strings.form.heading}
            </Heading>
            <TodoForm panel submitLabel={strings.form.add} onSubmit={createTodo} />
          </Box>
          <Box
            as="section"
            aria-label={strings.list.sectionLabel}
            display="flex"
            flexDirection="column"
            minH="lg"
            {...card}
          >
            <TodoList />
          </Box>
        </SimpleGrid>
      </Container>
    </MotionConfig>
  );
}
