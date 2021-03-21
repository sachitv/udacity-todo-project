import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader,
  Select
} from 'semantic-ui-react'

import { createTodo, deleteTodo, getTodos, patchTodo } from '../api/todos-api'
import Auth from '../auth/Auth'
import { Todo } from '../types/Todo'

interface TodosProps {
  auth: Auth
  history: History
}

interface TodosState {
  todos: Todo[]
  newTodoName: string
  loadingTodos: boolean
  sortby: string
  order: string
}

export class Todos extends React.PureComponent<TodosProps, TodosState> {
  state: TodosState = {
    todos: [],
    newTodoName: '',
    loadingTodos: true,
    sortby: 'name',
    order: 'ascending'
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTodoName: event.target.value })
  }

  onEditButtonClick = (todoId: string) => {
    this.props.history.push(`/todos/${todoId}/edit`)
  }

  onTodoCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const dueDate = this.calculateDueDate()
      const newTodo = await createTodo(this.props.auth.getIdToken(), {
        name: this.state.newTodoName,
        dueDate
      })
      this.setState({
        todos: [...this.state.todos, newTodo],
        newTodoName: ''
      })
    } catch {
      alert('Todo creation failed')
    }
  }

  onTodoDelete = async (todoId: string) => {
    try {
      await deleteTodo(this.props.auth.getIdToken(), todoId)
      this.setState({
        todos: this.state.todos.filter((todo) => todo.todoId != todoId)
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  onTodoCheck = async (pos: number) => {
    try {
      const todo = this.state.todos[pos]
      await patchTodo(this.props.auth.getIdToken(), todo.todoId, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: !todo.done
      })
      this.setState({
        todos: update(this.state.todos, {
          [pos]: { done: { $set: !todo.done } }
        })
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  async componentDidMount() {
    try {
      const todos = await getTodos(this.props.auth.getIdToken())
      this.setState({
        todos,
        loadingTodos: false
      })
    } catch (e) {
      alert(`Failed to fetch todos: ${e.message}`)
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">TODOs</Header>

        {this.renderCreateTodoInput()}
        {this.renderChooseSortOrder()}
        {this.renderTodos()}
      </div>
    )
  }

  renderCreateTodoInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'add',
              content: 'New task',
              onClick: this.onTodoCreate
            }}
            fluid
            actionPosition="left"
            placeholder="To change the world..."
            onChange={this.handleNameChange}
          />
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }

  sortTodosByName = () => {
    this.setState({
      todos: this.state.todos.sort((first: Todo, second: Todo) => {
        const ascending_multiplier = this.state.order == 'ascending' ? 1 : -1
        const first_name: string = first.name.toLowerCase()
        const second_name: string = second.name.toLowerCase()
        if (first_name < second_name) {
          return -1 * ascending_multiplier
        }
        if (first_name > second_name) {
          return 1 * ascending_multiplier
        }
        return 0
      })
    })
  }

  sortTodosByCreated = () => {
    this.setState({
      todos: this.state.todos.sort((first: Todo, second: Todo) => {
        const ascending_multiplier = this.state.order == 'ascending' ? 1 : -1
        const first_created: string = first.createdAt.toLowerCase()
        const second_created: string = second.createdAt.toLowerCase()
        if (first_created < second_created) {
          return -1 * ascending_multiplier
        }
        if (first_created > second_created) {
          return 1 * ascending_multiplier
        }
        return 0
      })
    })
  }

  sortTodosByDueDate = () => {
    this.setState({
      todos: this.state.todos.sort((first: Todo, second: Todo) => {
        const ascending_multiplier = this.state.order == 'ascending' ? 1 : -1
        const first_dueDate: string = first.dueDate.toLowerCase()
        const second_dueDate: string = second.dueDate.toLowerCase()
        if (first_dueDate < second_dueDate) {
          return -1 * ascending_multiplier
        }
        if (first_dueDate > second_dueDate) {
          return 1 * ascending_multiplier
        }
        return 0
      })
    })
  }

  sortTodos = () => {
    if (this.state.sortby == 'name') {
      this.sortTodosByName()
    } else if (this.state.sortby == 'createdAt') {
      this.sortTodosByCreated()
    } else if (this.state.sortby == 'dueDate') {
      this.sortTodosByDueDate()
    }
  }

  setSortBy = (e: any, { value }: any) => {
    this.setState({
      sortby: value
    })
  }

  setOrder = (e: any, { value }: any) => {
    this.setState({
      order: value
    })
  }

  renderChooseSortOrder() {
    const sortByItems = [
      { text: 'name', value: 'name', key: 'name' },
      { text: 'dueDate', value: 'dueDate', key: 'dueDate' },
      { text: 'createdAt', value: 'createdAt', key: 'createdAt' }
    ]
    const sortOrder = [
      { text: 'Ascending', value: 'ascending', key: 'asc' },
      { text: 'Descending', value: 'descending', key: 'desc' }
    ]
    return (
      <Grid>
        <Grid.Row key="selectors">
          <Grid.Column key="sort-by" width={3}>
            <Select
              placeholder="Sort By"
              options={sortByItems}
              onChange={this.setSortBy}
              value={this.state.sortby}
            />
          </Grid.Column>
          <Grid.Column key="sort-order">
            <Select
              placeholder="Sort Order"
              options={sortOrder}
              onChange={this.setOrder}
              value={this.state.order}
            />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    )
  }

  renderTodos() {
    this.sortTodos()

    if (this.state.loadingTodos) {
      return this.renderLoading()
    }
    return this.renderTodosList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading TODOs
        </Loader>
      </Grid.Row>
    )
  }

  renderTodosList() {
    return (
      <Grid padded>
        {this.state.todos.map((todo, pos) => {
          return (
            <Grid.Row key={todo.todoId}>
              <Grid.Column width={1} verticalAlign="middle">
                <Checkbox
                  onChange={() => this.onTodoCheck(pos)}
                  checked={todo.done}
                />
              </Grid.Column>
              <Grid.Column width={10} verticalAlign="middle">
                {todo.name}
              </Grid.Column>
              <Grid.Column width={3} floated="right">
                {todo.dueDate}
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="blue"
                  onClick={() => this.onEditButtonClick(todo.todoId)}
                >
                  <Icon name="pencil" />
                </Button>
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="red"
                  onClick={() => this.onTodoDelete(todo.todoId)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>
              {todo.attachmentUrl && (
                <Image src={todo.attachmentUrl} size="small" wrapped />
              )}
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

  calculateDueDate(): string {
    const date = new Date()
    date.setDate(date.getDate() + 7)

    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}
