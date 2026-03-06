Vue.component('column', {
    template: `
        <div class="column">
            <h2>{{ title }}</h2>
            <card 
                v-for="card in cards" 
                :key="card.id"
                :card="card"
                @delete="$emit('delete', $event)"
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
        }
    }
})

Vue.component('card', {
    template: `
         <div class="card">
            
            <div v-if="!isEditing">
                <h3>{{ card.title }}</h3>
                <p>{{ card.description }}</p>
                <p>Дэдлайн: {{ card.deadline }}</p>
                <p>Создано: {{ card.creationDate }}</p>
                <p v-if="card.lastEdited">Последнее редактирование: {{ card.lastEdited }}</p>

                <button @click="isEditing=true">Редактировать</button>
                <button @click="$emit('delete', card.id)">Удалить</button>
            </div>

            <div v-else class="edit-form">
                <label>Название:</label>
                <input type="text" v-model="card.title">
                
                <label>Описание:</label>
                <textarea v-model="card.description"></textarea>
                
                <label>Дэдлайн:</label>
                <input type="date" v-model="card.deadline">
                
                <button @click="saveCard">Готово</button>
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
            isEditing: false 
        }
    },
    methods: {
        saveCard() {
            this.isEditing = false;
            this.card.lastEdited = new Date().toLocaleString();
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
                creationDate: new Date().toLocaleString(),
                id: Date.now()
            }
            this.$emit('card-submitted', card);
            this.title = '',
            this.description = '',
            this.deadline = ''
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
                    :title="col.title" 
                    @delete="deleteCard"
                ></column>
            </div>
        </div>
    `,
    data() {
        return {
            cards: [],
            columns: [
                { title: 'Запланированные задачи' }, 
                { title: 'Задачи в работе' },
                { title: 'Тестирование' },
                { title: 'Выполненные задачи' }
            ]
        }
    },
    methods: {
        addCard(card) {
            this.cards.unshift(card);
        },
        deleteCard(id) {
            this.cards = this.cards.filter(card => card.id !== id);
        }
    },
})

let app = new Vue ({
    el: '#app'
})