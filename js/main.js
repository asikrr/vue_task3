Vue.component('column', {
    template: `
        <div class="column">
            <h2>{{ title }}</h2>
            <card 
                v-for="card in cards" 
                :key="card.id"
                :card="card"
                @delete="$emit('delete', $event)"
                @move="$emit('move', $event)"
            ></card>
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
        }
    }
})

Vue.component('card', {
    template: `
         <div class="card">
            <div v-if="!isEditing && !showReturnInput">
                <h3>{{ card.title }}</h3>
                <p>{{ card.description }}</p>
                <p>Дэдлайн: {{ card.deadline }}</p>
                <p>Создано: {{ card.creationDate }}</p>
                <p v-if="card.lastEdited">Последнее редактирование: {{ card.lastEdited }}</p>
                <p v-if="card.returnReason && card.colNumber === 2">
                    Причина возврата: {{ card.returnReason }}
                </p>

                <div v-if="card.colNumber === 4">
                    <p v-if="card.isOverdue">Просрочена</p>
                    <p v-else>Выполнена в срок</p>
                </div>

                <button @click="isEditing=true">Редактировать</button>
                <button @click="$emit('delete', card.id)" v-if="card.colNumber === 1">Удалить</button>
                
                <button 
                    @click="showReturnInput = true"
                    v-if="card.colNumber === 3"
                >
                    Переместить влево
                </button>
                
                <button 
                    @click="$emit('move', { cardId: card.id, direction: 'right' })" 
                    v-if="card.colNumber < 4"
                >
                    Переместить вправо
                </button>
            </div>

            <div v-else-if="isEditing" class="edit-form">
                <label>Название:</label>
                <input type="text" v-model="card.title">
                
                <label>Описание:</label>
                <textarea v-model="card.description"></textarea>
                
                <label>Дэдлайн:</label>
                <input type="date" v-model="card.deadline">
                
                <button @click="saveCard">Готово</button>
            </div>

            <div v-else-if="showReturnInput" class="return-form">
                <textarea v-model="returnReasonText" placeholder="Причина возврата"></textarea>
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
            returnReasonText: ''
        }
    },
    methods: {
        saveCard() {
            this.isEditing = false;
            this.card.lastEdited = new Date().toISOString().split('T')[0];
        },
        confirmReturn() {
            this.$emit('move', { 
                cardId: this.card.id, 
                direction: 'left', 
                reason: this.returnReasonText 
            });
            this.showReturnInput = false;
        }
    }
})

Vue.component('card-form', {
    template: `
        <form @submit.prevent="onSubmit">
            <div>
                <label for="title">Название задачи</label>
                <input type="text" id="title" v-model="title">
            </div>

            <div>
                <label for="description">Описание задачи</label>
                <textarea id="description" v-model="description"></textarea>
            </div>

            <div>
                <label for="deadline">Дэдлайн</label>
                <input type="date" id="deadline" v-model="deadline">
            </div>

            <input type="submit" value="Сохранить">
        </form>
    `,
    data() {
        return {
            title: '',
            description: '',
            deadline: ''
        }
    },
    methods: {
        onSubmit(){
            let card = {
                title: this.title,
                description: this.description,
                deadline: this.deadline,
                creationDate: new Date().toISOString().split('T')[0],
                id: Date.now(),
                colNumber: 1,
                returnReason: null
            }
            this.$emit('card-submitted', card);
            this.title = '';
            this.description = '';
            this.deadline = '';
        }
    }
})

Vue.component('board', {
    template: `
        <div>
            <h1>Kanban-доска</h1>
            <card-form @card-submitted="addCard"></card-form>
            <div class="columns">
                <column 
                    v-for="col in columns" 
                    :key="col.id"
                    :title="col.title" 
                    :id="col.id"
                    :cards="cards.filter(card => card.colNumber === col.id)"
                    @delete="deleteCard"
                    @move="moveCard"
                ></column>
            </div>
        </div>
    `,
    data() {
        return {
            cards: [],
            columns: [
                { id: 1, title: 'Запланированные задачи' }, 
                { id: 2, title: 'Задачи в работе' },
                { id: 3, title: 'Тестирование' },
                { id: 4, title: 'Выполненные задачи' }
            ]
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
                    } else {
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