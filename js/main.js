Vue.component('column', {
    template: `
        <div class="column">
            <h2>{{ title }}</h2>
            <card 
                v-for="card in cards" 
                :card="card"
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
            <p>{{ card.title }}</p>
            <p>{{ card.description }}</p>
            <p>Дэдлайн: {{ card.deadline }}</p>
            <p>Дата создания: {{ card.creationDate }}</p>
        </div>
    `,
    props: {
        card: {
            type: Object,
            required: true
        } 
    },
    methods: {
        updateCard() {

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
                creationDate: new Date().toLocaleString()
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
                <column :cards="cards" title="Запланированные задачи"></column>
                <column :cards="cards" title="Задачи в работе"></column>
                <column :cards="cards" title="Тестирование"></column>
                <column :cards="cards" title="Выполненные задачи"></column>
            </div>
        </div>
    `,
    data() {
        return {
            cards: []
        }
    },
    methods: {
        addCard(card) {
            this.cards.unshift(card);
        }
    },
})

let app = new Vue ({
    el: '#app'
})