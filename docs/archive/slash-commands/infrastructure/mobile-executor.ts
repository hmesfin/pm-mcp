/**
 * Mobile Builder Executor
 *
 * Implements the SessionExecutor interface for React Native mobile app sessions.
 * Launches mobile-builder agent via Task tool and coordinates mobile TDD workflow.
 *
 * @see execution-orchestrator.ts for SessionExecutor interface
 * @see .claude/agents/mobile-builder.md for agent specification
 */

import type { AgentState, Phase, Session } from './types'
import type { SessionExecutor } from './execution-orchestrator'

// ============================================================================
// Mobile Executor Implementation
// ============================================================================

export class MobileExecutor implements SessionExecutor {
  /**
   * Execute RED phase: Write mobile tests
   *
   * Launches mobile-builder agent with instructions to:
   * 1. Read session objectives from PROJECT_PLAN.md
   * 2. Write comprehensive React Native tests (Jest + Testing Library)
   * 3. Run tests (should FAIL - implementation doesn't exist yet)
   */
  async executeRedPhase(
    state: AgentState,
    phase: Phase,
    session: Session
  ): Promise<{
    tests_written: number
    tests_failing: number
    files_modified: string[]
  }> {
    console.log(`\n[RED PHASE] Writing mobile tests for: ${session.title}\n`)

    // Build prompt for mobile-builder agent
    const prompt = this.buildRedPhasePrompt(state, phase, session)

    // TODO: Launch mobile-builder agent via Task tool
    console.log('TODO: Launch mobile-builder agent for RED phase')
    console.log('Prompt:', prompt)

    // Placeholder return
    // Example for Screen Implementation session
    return {
      tests_written: 25,
      tests_failing: 25,
      files_modified: [
        'mobile/src/screens/PostListScreen.test.tsx',
        'mobile/src/screens/PostDetailScreen.test.tsx',
        'mobile/src/components/PostCard.test.tsx',
        'mobile/src/hooks/usePosts.test.ts'
      ]
    }
  }

  /**
   * Execute GREEN phase: Implement mobile screens/components
   *
   * Launches mobile-builder agent with instructions to:
   * 1. Implement screens using React Native Paper components
   * 2. Set up navigation with React Navigation
   * 3. Handle platform-specific code (iOS vs Android)
   * 4. Run tests and verify they PASS
   */
  async executeGreenPhase(
    state: AgentState,
    phase: Phase,
    session: Session
  ): Promise<{
    tests_passing: number
    coverage: number
    files_modified: string[]
  }> {
    console.log(`\n[GREEN PHASE] Implementing mobile code for: ${session.title}\n`)

    // Build prompt for mobile-builder agent
    const prompt = this.buildGreenPhasePrompt(state, phase, session)

    // TODO: Launch mobile-builder agent via Task tool
    console.log('TODO: Launch mobile-builder agent for GREEN phase')
    console.log('Prompt:', prompt)

    // Placeholder return
    return {
      tests_passing: 25,
      coverage: 87,
      files_modified: [
        'mobile/src/screens/PostListScreen.tsx',
        'mobile/src/screens/PostDetailScreen.tsx',
        'mobile/src/components/PostCard.tsx',
        'mobile/src/hooks/usePosts.ts',
        'mobile/src/navigation/AppNavigator.tsx'
      ]
    }
  }

  /**
   * Execute REFACTOR phase: Optimize mobile code
   *
   * Launches mobile-builder agent with instructions to:
   * 1. Extract platform-specific code
   * 2. Optimize performance (FlatList, memo, etc.)
   * 3. Improve accessibility
   * 4. Run tests and verify they still PASS
   */
  async executeRefactorPhase(
    state: AgentState,
    phase: Phase,
    session: Session
  ): Promise<{
    files_modified: string[]
    coverage: number
  }> {
    console.log(`\n[REFACTOR PHASE] Optimizing mobile code for: ${session.title}\n`)

    // Build prompt for mobile-builder agent
    const prompt = this.buildRefactorPhasePrompt(state, phase, session)

    // TODO: Launch mobile-builder agent via Task tool
    console.log('TODO: Launch mobile-builder agent for REFACTOR phase')
    console.log('Prompt:', prompt)

    // Placeholder return
    return {
      files_modified: [
        'mobile/src/screens/PostListScreen.tsx',
        'mobile/src/components/PlatformButton.tsx',
        'mobile/src/utils/platform.ts'
      ],
      coverage: 88
    }
  }

  /**
   * Create git commit for completed session
   */
  async createCommit(
    state: AgentState,
    phase: Phase,
    session: Session
  ): Promise<string> {
    console.log(`\n[COMMIT] Creating commit for: ${session.title}\n`)

    // Build commit message following project conventions
    const commitMessage = this.buildCommitMessage(state, phase, session)

    // TODO: Execute git commands
    console.log('TODO: Execute git commit')
    console.log('Commit message:', commitMessage)

    // Placeholder return
    return 'mob1a2b3c'
  }

  // ==========================================================================
  // Prompt Building
  // ==========================================================================

  /**
   * Build prompt for RED phase (write mobile tests)
   */
  private buildRedPhasePrompt(
    state: AgentState,
    phase: Phase,
    session: Session
  ): string {
    return `
# Mobile Builder Agent - RED Phase

You are executing **Session ${session.number}: ${session.title}** for the **${state.app_type}** mobile application.

## Your Mission

Write comprehensive React Native tests FIRST, following TDD principles.

## Context

**Project**: ${state.project_name}
**App Type**: ${state.app_type}
**Phase**: ${phase.number} - ${phase.name}
**Session**: ${session.number} - ${session.title}

## Session Objectives

Read the session objectives from:
- \`project-plans/${state.project_name}/PROJECT_PLAN.md\` - Session ${session.number} objectives

Read the technical specifications from:
- \`project-plans/${state.project_name}/REQUIREMENTS.md\` - API endpoints, UI mockups, navigation flow

## Session Type Detection

Identify which type of mobile session this is:

${this.getSessionTypeGuidance(session.title)}

## RED Phase Instructions

### 1. Identify Session Type

Read the session title and objectives to determine what to build.

### 2. Write Tests FIRST (in \`mobile/src/\`)

${this.getTestGuidanceForSession(session.title)}

### 3. Test Framework

- **Test Runner**: Jest (built into React Native)
- **Component Testing**: React Native Testing Library
- **Mocking**: \`jest.mock()\` for API calls
- **Coverage Target**: Minimum 85%

### 4. Test Structure Examples

#### Screen Tests

\`\`\`typescript
// mobile/src/screens/PostListScreen.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { PostListScreen } from './PostListScreen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
)

describe('PostListScreen', () => {
  it('renders list of posts', async () => {
    const mockPosts = [
      { uuid: '1', title: 'Post 1', excerpt: 'Excerpt 1' },
      { uuid: '2', title: 'Post 2', excerpt: 'Excerpt 2' }
    ]

    jest.spyOn(require('@/hooks/usePosts'), 'usePosts').mockReturnValue({
      data: mockPosts,
      isLoading: false,
      error: null
    })

    render(<PostListScreen />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Post 1')).toBeTruthy()
      expect(screen.getByText('Post 2')).toBeTruthy()
    })
  })

  it('navigates to detail on post tap', async () => {
    const mockNavigate = jest.fn()

    render(
      <PostListScreen navigation={{ navigate: mockNavigate } as any} />,
      { wrapper }
    )

    const postCard = screen.getByTestID('post-card-1')
    fireEvent.press(postCard)

    expect(mockNavigate).toHaveBeenCalledWith('PostDetail', { uuid: '1' })
  })

  it('shows loading indicator while fetching', () => {
    jest.spyOn(require('@/hooks/usePosts'), 'usePosts').mockReturnValue({
      data: [],
      isLoading: true,
      error: null
    })

    render(<PostListScreen />, { wrapper })

    expect(screen.getByTestID('loading-indicator')).toBeTruthy()
  })

  it('shows error message on fetch failure', () => {
    jest.spyOn(require('@/hooks/usePosts'), 'usePosts').mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Network error')
    })

    render(<PostListScreen />, { wrapper })

    expect(screen.getByText(/Network error/i)).toBeTruthy()
  })
})
\`\`\`

#### Component Tests

\`\`\`typescript
// mobile/src/components/PostCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native'
import { PostCard } from './PostCard'

describe('PostCard', () => {
  const mockPost = {
    uuid: '1',
    title: 'Test Post',
    excerpt: 'Test excerpt',
    author: { name: 'John Doe' }
  }

  it('renders post information', () => {
    render(<PostCard post={mockPost} onPress={jest.fn()} />)

    expect(screen.getByText('Test Post')).toBeTruthy()
    expect(screen.getByText('Test excerpt')).toBeTruthy()
    expect(screen.getByText('John Doe')).toBeTruthy()
  })

  it('calls onPress when tapped', () => {
    const mockOnPress = jest.fn()

    render(<PostCard post={mockPost} onPress={mockOnPress} />)

    fireEvent.press(screen.getByTestID('post-card-1'))

    expect(mockOnPress).toHaveBeenCalledWith('1')
  })

  it('shows published badge for published posts', () => {
    const publishedPost = { ...mockPost, status: 'published' }

    render(<PostCard post={publishedPost} onPress={jest.fn()} />)

    expect(screen.getByTestID('published-badge')).toBeTruthy()
  })
})
\`\`\`

#### Hook Tests

\`\`\`typescript
// mobile/src/hooks/usePosts.test.ts
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePosts } from './usePosts'
import * as api from '@/api'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
)

describe('usePosts', () => {
  it('fetches posts successfully', async () => {
    const mockPosts = [
      { uuid: '1', title: 'Post 1' },
      { uuid: '2', title: 'Post 2' }
    ]

    jest.spyOn(api, 'getPosts').mockResolvedValue(mockPosts)

    const { result } = renderHook(() => usePosts(), { wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toEqual(mockPosts)
    })
  })

  it('handles fetch errors', async () => {
    jest.spyOn(api, 'getPosts').mockRejectedValue(new Error('API error'))

    const { result } = renderHook(() => usePosts(), { wrapper })

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
      expect(result.current.error?.message).toBe('API error')
    })
  })
})
\`\`\`

### 5. Run Tests

\`\`\`bash
cd mobile
npm run test:run
\`\`\`

**Expected Result**: ALL TESTS SHOULD FAIL (implementation doesn't exist yet)

### 6. Output

Report back:
- Number of tests written
- Number of tests failing (should be 100%)
- List of test files created

## Exit Criteria

- [ ] All test files created in \`mobile/src/\`
- [ ] Tests cover success scenarios
- [ ] Tests cover error scenarios
- [ ] Tests cover loading states
- [ ] Tests cover navigation
- [ ] All tests FAILING (as expected in RED phase)
- [ ] Test count: ~${session.estimated_hours * 10} tests (estimate)

## Important Notes

- **DO** use functional components with hooks
- **DO** use TypeScript strict mode (no \`any\` except for navigation types)
- **DO** use \`testID\` for test selectors
- **DO** mock API calls with \`jest.mock()\`
- **DO** test both iOS and Android behavior if different
- **DO NOT** skip tests - write them FIRST
- **DO NOT** use class components

Good luck! TDD is the key to maintainable mobile apps. 📱
`.trim()
  }

  /**
   * Build prompt for GREEN phase (implement mobile screens/components)
   */
  private buildGreenPhasePrompt(
    state: AgentState,
    phase: Phase,
    session: Session
  ): string {
    return `
# Mobile Builder Agent - GREEN Phase

You are executing **Session ${session.number}: ${session.title}** for the **${state.app_type}** mobile application.

## Your Mission

Implement mobile screens/components/hooks to make tests PASS.

## Context

**Project**: ${state.project_name}
**Phase**: ${phase.number} - ${phase.name}
**Session**: ${session.number} - ${session.title}
**Tests Written**: ${session.tests_written}
**Tests Failing**: ${session.tests_failing}

## GREEN Phase Instructions

### 1. Review Failing Tests

Read the test files to understand what needs to be implemented:
- What screens/components are being tested?
- What props/navigation are expected?
- What data structures are required?

### 2. Implement Mobile Code

${this.getImplementationGuidanceForSession(session.title)}

### 3. Implementation Examples

#### Screen Implementation

\`\`\`typescript
// mobile/src/screens/PostListScreen.tsx
import React from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import { ActivityIndicator, Card, Text } from 'react-native-paper'
import { usePosts } from '@/hooks/usePosts'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

type Props = NativeStackScreenProps<RootStackParamList, 'PostList'>

export function PostListScreen({ navigation }: Props): JSX.Element {
  const { data: posts, isLoading, error } = usePosts()

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator testID="loading-indicator" size="large" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text>Error: {error.message}</Text>
      </View>
    )
  }

  function handlePostPress(uuid: string): void {
    navigation.navigate('PostDetail', { uuid })
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.uuid}
      renderItem={({ item }) => (
        <Card
          testID={\`post-card-\${item.uuid}\`}
          style={styles.card}
          onPress={() => handlePostPress(item.uuid)}
        >
          <Card.Title title={item.title} />
          <Card.Content>
            <Text>{item.excerpt}</Text>
          </Card.Content>
        </Card>
      )}
      contentContainerStyle={styles.list}
    />
  )
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  list: {
    padding: 16
  },
  card: {
    marginBottom: 12
  }
})
\`\`\`

#### Component Implementation

\`\`\`typescript
// mobile/src/components/PostCard.tsx
import React from 'react'
import { StyleSheet } from 'react-native'
import { Card, Text, Badge } from 'react-native-paper'
import type { Post } from '@/types'

interface PostCardProps {
  post: Post
  onPress: (uuid: string) => void
}

export function PostCard({ post, onPress }: PostCardProps): JSX.Element {
  return (
    <Card
      testID={\`post-card-\${post.uuid}\`}
      style={styles.card}
      onPress={() => onPress(post.uuid)}
    >
      <Card.Title
        title={post.title}
        subtitle={post.author.name}
        right={
          post.status === 'published'
            ? () => <Badge testID="published-badge">Published</Badge>
            : undefined
        }
      />
      <Card.Content>
        <Text>{post.excerpt}</Text>
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12
  }
})
\`\`\`

#### Hook Implementation

\`\`\`typescript
// mobile/src/hooks/usePosts.ts
import { useQuery } from '@tanstack/react-query'
import { getPosts } from '@/api'
import type { Post } from '@/types'

export function usePosts() {
  return useQuery<Post[], Error>({
    queryKey: ['posts'],
    queryFn: async () => {
      const response = await getPosts()
      return response
    }
  })
}

export function usePost(uuid: string) {
  return useQuery<Post, Error>({
    queryKey: ['post', uuid],
    queryFn: async () => {
      const response = await getPost(uuid)
      return response
    },
    enabled: Boolean(uuid)
  })
}
\`\`\`

#### Navigation Setup

\`\`\`typescript
// mobile/src/navigation/AppNavigator.tsx
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { PostListScreen } from '@/screens/PostListScreen'
import { PostDetailScreen } from '@/screens/PostDetailScreen'

export type RootStackParamList = {
  PostList: undefined
  PostDetail: { uuid: string }
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export function AppNavigator(): JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="PostList">
        <Stack.Screen
          name="PostList"
          component={PostListScreen}
          options={{ title: 'Posts' }}
        />
        <Stack.Screen
          name="PostDetail"
          component={PostDetailScreen}
          options={{ title: 'Post Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
\`\`\`

### 4. Code Quality Standards

- **TypeScript strict mode** - No \`any\` types (except navigation edge cases)
- **Explicit return types** - Always specify \`JSX.Element\`, \`void\`, etc.
- **Functional components** - No class components
- **Hooks** - Use React hooks for state and side effects
- **testID** - Add to all interactive elements for testing

### 5. Run Tests

\`\`\`bash
cd mobile
npm run test:run
\`\`\`

**Expected Result**: ALL TESTS SHOULD NOW PASS

### 6. Check Coverage

\`\`\`bash
cd mobile
npm run test:coverage
\`\`\`

**Coverage Target**: Minimum 85%

### 7. Output

Report back:
- Number of tests passing
- Coverage percentage
- List of files created

## Exit Criteria

- [ ] All tests passing (${session.tests_written}/${session.tests_written})
- [ ] Coverage >= 85%
- [ ] Type checking passes (\`npm run type-check\`)
- [ ] No \`any\` types in implementation
- [ ] Navigation works correctly

## Important Notes

- **DO** use React Native Paper components for UI
- **DO** handle loading and error states
- **DO** use TypeScript strict mode
- **DO** add \`testID\` to all interactive elements
- **DO NOT** use inline styles - use StyleSheet.create()
- **DO NOT** use class components

Now make those tests GREEN! 💚
`.trim()
  }

  /**
   * Build prompt for REFACTOR phase (optimize mobile code)
   */
  private buildRefactorPhasePrompt(
    state: AgentState,
    phase: Phase,
    session: Session
  ): string {
    return `
# Mobile Builder Agent - REFACTOR Phase

You are executing **Session ${session.number}: ${session.title}** for the **${state.app_type}** mobile application.

## Your Mission

Optimize mobile code for performance, platform-specific behavior, and maintainability.

## Context

**Project**: ${state.project_name}
**Phase**: ${phase.number} - ${phase.name}
**Session**: ${session.number} - ${session.title}
**Tests Passing**: ${session.tests_passing}/${session.tests_written}
**Current Coverage**: ${session.coverage}%

## REFACTOR Phase Instructions

### 1. Platform-Specific Optimizations

Extract platform-specific code:

\`\`\`typescript
// mobile/src/components/PlatformButton.tsx
import { Platform, StyleSheet } from 'react-native'
import { Button } from 'react-native-paper'

interface PlatformButtonProps {
  title: string
  onPress: () => void
}

export function PlatformButton({ title, onPress }: PlatformButtonProps): JSX.Element {
  return (
    <Button
      mode="contained"
      onPress={onPress}
      style={styles.button}
      contentStyle={styles.content}
    >
      {title}
    </Button>
  )
}

const styles = StyleSheet.create({
  button: {
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84
      },
      android: {
        elevation: 5
      }
    })
  },
  content: {
    paddingVertical: Platform.OS === 'ios' ? 4 : 0
  }
})
\`\`\`

### 2. Performance Optimizations

#### Memoize Components

\`\`\`typescript
// mobile/src/components/PostCard.tsx
import React, { memo } from 'react'

export const PostCard = memo(function PostCard({ post, onPress }: PostCardProps) {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if post changes
  return prevProps.post.uuid === nextProps.post.uuid
})
\`\`\`

#### Optimize FlatList

\`\`\`typescript
// mobile/src/screens/PostListScreen.tsx
<FlatList
  data={posts}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
  // Performance optimizations
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={5}
  // Avoid anonymous functions
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index
  })}
/>
\`\`\`

### 3. Accessibility Improvements

\`\`\`typescript
// mobile/src/components/PostCard.tsx
<Card
  accessible={true}
  accessibilityLabel={\`Post titled \${post.title}\`}
  accessibilityRole="button"
  accessibilityHint="Tap to view post details"
  onPress={() => onPress(post.uuid)}
>
  {/* ... */}
</Card>
\`\`\`

### 4. Extract Utilities

\`\`\`typescript
// mobile/src/utils/platform.ts
import { Platform, StyleSheet } from 'react-native'

export function getPlatformElevation(level: number) {
  return Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: level },
      shadowOpacity: 0.25,
      shadowRadius: level * 2
    },
    android: {
      elevation: level
    }
  })
}

// Usage
const styles = StyleSheet.create({
  card: {
    ...getPlatformElevation(2)
  }
})
\`\`\`

### 5. Run Tests Again

\`\`\`bash
cd mobile
npm run test:run
npm run test:coverage
\`\`\`

**Expected Result**: Tests still PASS, coverage >= 85%

### 6. Type Check

\`\`\`bash
cd mobile
npm run type-check
\`\`\`

**Expected Result**: No type errors

### 7. Output

Report back:
- List of optimizations made
- Coverage percentage (should still be >= 85%)
- Performance improvements (if measurable)

## Exit Criteria

- [ ] All tests still passing
- [ ] Coverage >= 85%
- [ ] Type checking passes
- [ ] Platform-specific code extracted
- [ ] Performance optimizations applied
- [ ] Accessibility improved

## Important Notes

- **DO** use \`memo\` for expensive components
- **DO** optimize FlatList rendering
- **DO** add accessibility labels
- **DO** extract platform-specific utilities
- **DO NOT** change behavior - only optimize
- **DO NOT** break tests

Polish that mobile code to perfection! ✨
`.trim()
  }

  /**
   * Get session type guidance based on session title
   */
  private getSessionTypeGuidance(sessionTitle: string): string {
    const title = sessionTitle.toLowerCase()

    if (title.includes('setup') || title.includes('navigation')) {
      return `**Session Type**: Mobile Setup
- Set up React Native project structure
- Configure navigation (React Navigation)
- Set up API client
- Create shared components`
    }

    if (title.includes('screen') || title.includes('auth') || title.includes('home')) {
      return `**Session Type**: Screen Implementation
- Implement mobile screens (Auth, Home, Detail, etc.)
- Use React Native Paper components
- Implement navigation flow
- Handle platform-specific code (iOS vs Android)`
    }

    if (
      title.includes('push') ||
      title.includes('camera') ||
      title.includes('biometric') ||
      title.includes('offline')
    ) {
      return `**Session Type**: Mobile-Specific Features
- Push notifications (expo-notifications)
- Camera/photo upload (expo-image-picker)
- Biometric auth (expo-local-authentication)
- Offline support (AsyncStorage)
- Geolocation (expo-location)`
    }

    return `**Session Type**: General Mobile Implementation
Read PROJECT_PLAN.md Session ${sessionTitle} for objectives.`
  }

  /**
   * Get test guidance based on session title
   */
  private getTestGuidanceForSession(sessionTitle: string): string {
    const title = sessionTitle.toLowerCase()

    if (title.includes('setup') || title.includes('navigation')) {
      return `Write tests for:
- Navigation configuration
- App entry point
- Initial screen rendering
- Navigation between screens`
    }

    if (title.includes('screen')) {
      return `Write tests for:
- Screen rendering with data
- Loading states
- Error states
- Navigation on user interaction
- Form submission (if applicable)`
    }

    if (title.includes('component')) {
      return `Write tests for:
- Component rendering with props
- User interactions (press, swipe, etc.)
- Conditional rendering
- Accessibility`
    }

    if (title.includes('hook')) {
      return `Write tests for:
- Data fetching
- Loading states
- Error handling
- Refetching logic`
    }

    return `Write comprehensive tests covering:
- Success scenarios
- Error scenarios
- Loading states
- User interactions
- Navigation`
  }

  /**
   * Get implementation guidance based on session title
   */
  private getImplementationGuidanceForSession(sessionTitle: string): string {
    const title = sessionTitle.toLowerCase()

    if (title.includes('setup') || title.includes('navigation')) {
      return `Implement:
- Navigation configuration with React Navigation
- App entry point with providers (QueryClient, etc.)
- Shared components (Button, Card, etc.)
- API client setup`
    }

    if (title.includes('screen')) {
      return `Implement:
- Screen components using functional components
- React Native Paper components for UI
- Navigation integration
- Loading and error states
- Data fetching with TanStack Query`
    }

    if (title.includes('component')) {
      return `Implement:
- Reusable components
- Props validation with TypeScript
- Accessibility labels
- Platform-specific styling`
    }

    if (title.includes('hook')) {
      return `Implement:
- Custom hooks for data fetching
- TanStack Query integration
- Error handling
- Loading states`
    }

    return `Implement mobile code following React Native best practices`
  }

  /**
   * Build git commit message following project conventions
   */
  private buildCommitMessage(
    state: AgentState,
    phase: Phase,
    session: Session
  ): string {
    // Determine commit type from session title
    const title = session.title.toLowerCase()
    const type = title.includes('test')
      ? 'test'
      : title.includes('refactor')
        ? 'refactor'
        : 'feat'

    // Build concise subject line
    const subject = `${type}(mobile): ${session.title.toLowerCase()}`

    // Build commit body
    const body = `
Completed Session ${session.number}: ${session.title}

Phase: ${phase.name}
Tests: ${session.tests_passing}/${session.tests_written} passing
Coverage: ${session.coverage}%
Time: ${session.actual_hours}h (estimated: ${session.estimated_hours}h)

Files modified:
${session.files_modified.map(f => `- ${f}`).join('\n')}

Mobile stack:
- React Native + Expo
- TypeScript strict mode
- Jest + React Native Testing Library
- React Navigation
- React Native Paper

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
`.trim()

    return `${subject}\n\n${body}`
  }
}
