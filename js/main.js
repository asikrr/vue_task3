Vue.component('column', {
    template: `
        <div class="column">
            <h2 :class="color">{{ title }}</h2>
            <div class="column-content">
                <div v-if="id === 1">
                    <button v-if="!showForm" @click="showForm=true">Создать задачу</button>
                    <div v-else>
                        <card-form @card-submitted="onCardCreated"></card-form>
                    </div>
                </div>
                <card 
                    v-for="card in cards" 
                    :key="card.id"
                    :card="card"
                    @delete="$emit('delete', $event)"
                    @move="$emit('move', $event)"
                ></card>
            </div>
        </div>
    `,
    props: {
        title: {
            type: String,
            required: true
        },
        cards: {
            type: Array,
            required: true
        },
        id: {
            type: Number,
            required: true
        },
        color: {
            type: String
        }
    },
    data() {
        return {
            showForm: false
        }
    },
    methods: {
        onCardCreated(card) {
            this.showForm = false;
            this.$emit('create-card', card);
        }
    }
})

Vue.component('card', {
    template: `
         <div class="card">
            <div v-if="!isEditing && !showReturnInput">
                <div class="card-info">
                    <h3>{{ card.title }}</h3>
                    <p>{{ card.description }}</p>
                    <p>Дэдлайн: {{ card.deadline }}</p>
                    <p>Создано: {{ card.creationDate }}</p>
                    <p v-if="card.lastEdited">Последнее редактирование: {{ card.lastEdited }}</p>
                    <p v-if="card.returnReason && card.colNumber === 2">
                        Причина возврата: {{ card.returnReason }}
                    </p>
                    <div v-if="card.colNumber === 4">
                        <p v-if="card.isOverdue" class="dangerText">Просрочена</p>
                        <p v-else class="safeText">Выполнена в срок</p>
                    </div>
                </div>

                <div class="card-buttons">
                    <button 
                        @click="showReturnInput = true; returnReasonText = ''; returnError = ''"
                        v-if="card.colNumber === 3"
                    >
                        &lt
                    </button>
                    <button @click="isEditing=true" v-if="card.colNumber != 4">Редактировать</button>
                    <button @click="$emit('delete', card.id)" v-if="card.colNumber === 1">Удалить</button>
                    <button 
                        @click="$emit('move', { cardId: card.id, direction: 'right' })" 
                        v-if="card.colNumber < 4"
                    >
                        &gt
                    </button>
                </div>
            </div>

            <div v-else-if="isEditing" class="edit-form">
                <card-form 
                    :initial-card="card"
                    @card-submitted="saveCard"
                ></card-form>
                <button @click="isEditing=false">Отмена</button>
            </div>

            <div v-else-if="showReturnInput" class="return-form">
                <textarea v-model="returnReasonText" placeholder="Причина возврата"></textarea>
                <p v-if="returnError">{{ returnError }}</p>
                <button @click="confirmReturn">Подтвердить</button>
                <button @click="showReturnInput=false">Отмена</button>
            </div>

        </div>
    `,
    props: {
        card: {
            type: Object,
            required: true
        } 
    },
    data() {
        return {
            isEditing: false,
            showReturnInput: false,
            returnReasonText: '',
            returnError: ''
        }
    },
    methods: {
        saveCard(updatedCard) {
            this.card.title = updatedCard.title;
            this.card.description = updatedCard.description;
            this.card.deadline = updatedCard.deadline;
            this.isEditing = false;
            this.card.lastEdited = new Date().toLocaleString();
        },
        confirmReturn() {
            if (this.returnReasonText && this.returnReasonText.trim() !== '') {
                this.$emit('move', { 
                    cardId: this.card.id, 
                    direction: 'left', 
                    reason: this.returnReasonText 
                });
                this.showReturnInput = false;
                this.returnError = '';
            } 
            else {
                this.returnError = 'Поле обязательно для заполнения';
            }
        }
    }
})

Vue.component('card-form', {
    template: `
        <form class="card-form" @submit.prevent="onSubmit">
            <div>
                <label for="title">Название задачи</label>
                <input type="text" id="title" v-model="title" required>
            </div>

            <div>
                <label for="description">Описание задачи</label>
                <textarea id="description" v-model="description" required></textarea>
            </div>

            <div>
                <label for="deadline">Дэдлайн</label>
                <input type="date" id="deadline" v-model="deadline" required>
            </div>

            <input type="submit" value="Сохранить">
        </form>
    `,
    props: {
        initialCard: {
            type: Object,
            default: null
        }
    },
    data() {
        return {
            title: this.initialCard ? this.initialCard.title : '',
            description: this.initialCard ? this.initialCard.description : '',
            deadline: this.initialCard ? this.initialCard.deadline : ''
        }
    },
    methods: {
        onSubmit(){
            if (this.initialCard) {
                this.$emit('card-submitted', {
                    title: this.title,
                    description: this.description,
                    deadline: this.deadline
                });
            } 
            else {
                let card = {
                    title: this.title,
                    description: this.description,
                    deadline: this.deadline,
                    creationDate: new Date().toLocaleString(),
                    id: Date.now(),
                    colNumber: 1,
                    returnReason: null,
                    isOverdue: false
                }
                this.$emit('card-submitted', card);
                this.title = '';
                this.description = '';
                this.deadline = '';
            }
        }
    }
})

Vue.component('board', {
    template: `
        <div class="board">
            <h1>Kanban-доска</h1>
            <div class="columns">
                <column 
                    v-for="col in columns" 
                    :title="col.title" 
                    :id="col.id"
                    :color="col.color"
                    :cards="cards.filter(card => card.colNumber === col.id)"
                    @delete="deleteCard"
                    @move="moveCard"
                    @create-card="addCard"
                ></column>
            </div>
        </div>
    `,
    data() {
        return {
            cards: [],
            columns: [
                { id: 1, title: 'Запланированные задачи', color: 'col-plan' }, 
                { id: 2, title: 'Задачи в работе', color: 'col-work' },
                { id: 3, title: 'Тестирование', color: 'col-test' },
                { id: 4, title: 'Выполненные задачи', color: 'col-done' }
            ]
        }
    },
    mounted() {
        if (localStorage.getItem('cards')) {
            this.cards = JSON.parse(localStorage.getItem('cards'));
        }
    },
    watch: {
        cards: {
            handler(newCards) {
                localStorage.setItem('cards', JSON.stringify(newCards));
            },
            deep: true
        }
    },
    methods: {
        addCard(card) {
            this.cards.unshift(card);
        },
        deleteCard(id) {
            this.cards = this.cards.filter(card => card.id !== id);
        },
        moveCard({ cardId, direction, reason }) {
            const card = this.cards.find(c => c.id === cardId);

            if (direction === 'right') {
                card.colNumber++;
                if (card.colNumber === 4) {
                    const today = new Date().toISOString().split('T')[0]; 
                    if (today > card.deadline) {
                        card.isOverdue = true;
                    } 
                    else {
                        card.isOverdue = false;
                    }
                }
            } 
            else {
                card.colNumber = 2;
                card.returnReason = reason;
            }
        }
    }
})

let app = new Vue({
    el: '#app'
})