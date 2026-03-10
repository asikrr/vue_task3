Vue.component('column', {
    template: `
        <div class="column" 
             @dragover.prevent 
             @drop="onColumnDrop">
            <h2 :class="color">{{ title }}</h2>
            <div class="column-content">
                <div v-if="id === 1">
                    <button v-if="!showForm" @click="showForm=true">Создать задачу</button>
                    <div v-else>
                        <card-form @card-submitted="onCardCreated"></card-form>
                    </div>
                </div>
                
                <div v-if="id === 2 && showReturnForm" class="return-form">
                    <textarea v-model="returnReasonText" placeholder="Причина возврата"></textarea>
                    <p v-if="returnError" class="danger-text">{{ returnError }}</p>
                    <button @click="confirmReturn">Подтвердить</button>
                    <button @click="cancelReturn">Отмена</button>
                </div>
                
                <card 
                    v-for="(card, index) in cards" 
                    :key="card.id"
                    :card="card"
                    :index="index"
                    @delete="handleDelete"
                    @drag-start="handleDragStart"
                    @drop-target="handleCardDrop"
                    @update-card="handleUpdate"
                ></card>
            </div>
        </div>
    `,
    props: {
        title: String,
        cards: Array,
        id: Number,
        color: String,
        returnMode: Boolean
    },
    data() {
        return {
            showForm: false,
            returnReasonText: '',
            returnError: ''
        }
    },
    computed: {
        showReturnForm() {
            return this.returnMode;
        }
    },
    methods: {
        handleDelete(id) { this.$emit('delete', id); },
        handleUpdate(card) { this.$emit('update-card', card); },
        handleDragStart(card) { this.$emit('drag-start', card); },
        handleCardDrop(targetCard) { this.$emit('drop-card', targetCard); },
        
        onColumnDrop(event) {
            if (event.target.classList.contains('column') || event.target.classList.contains('column-content')) {
                this.$emit('drop-column', this.id);
            }
        },
        onCardCreated(card) {
            this.showForm = false;
            this.$emit('create-card', card);
        },
        confirmReturn() {
            if (this.returnReasonText && this.returnReasonText.trim() !== '') {
                this.$emit('confirm-return', this.returnReasonText);
                this.returnReasonText = '';
                this.returnError = '';
            } else {
                this.returnError = 'Поле обязательно для заполнения';
            }
        },
        cancelReturn() {
            this.$emit('cancel-return');
            this.returnReasonText = '';
            this.returnError = '';
        }
    }
})

Vue.component('card', {
    template: `
        <div class="card" 
             draggable="true" 
             @dragstart="onDragStart" 
             @drop.stop="onDrop"
             @dragover.prevent
             :data-index="index">
            <div v-if="!isEditing">
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
                        <p v-if="card.isOverdue" class="danger-text">Просрочена</p>
                        <p v-else class="safe-text">Выполнена в срок</p>
                    </div>
                </div>

                <div class="card-buttons">
                    <button @click="isEditing=true" v-if="card.colNumber != 4">Редактировать</button>
                    <button @click="handleDelete" v-if="card.colNumber === 1">Удалить</button>
                </div>
            </div>

            <div v-else-if="isEditing" class="edit-form">
                <card-form 
                    :initial-card="card"
                    @card-submitted="saveCard"
                ></card-form>
                <button @click="isEditing=false">Отмена</button>
            </div>
        </div>
    `,
    props: {
        card: Object,
        index: Number
    },
    data() {
        return { isEditing: false }
    },
    methods: {
        onDragStart() {
            this.$emit('drag-start', this.card);
        },
        onDrop() {
            this.$emit('drop-target', this.card);
        },
        handleDelete() {
            this.$emit('delete', this.card.id);
        },
        saveCard(updatedData) {
            const updatedCard = Object.assign({}, this.card, updatedData, { 
                lastEdited: new Date().toLocaleString() 
            });
            this.$emit('update-card', updatedCard);
            this.isEditing = false;
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
        initialCard: { type: Object, default: null }
    },
    data() {
        return {
            title: this.initialCard ? this.initialCard.title : '',
            description: this.initialCard ? this.initialCard.description : '',
            deadline: this.initialCard ? this.initialCard.deadline : ''
        }
    },
    methods: {
        onSubmit() {
            if (this.initialCard) {
                this.$emit('card-submitted', {
                    title: this.title,
                    description: this.description,
                    deadline: this.deadline
                });
            } else {
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
                    :return-mode="isReturnMode && col.id === 2"
                    @delete="deleteCard"
                    @create-card="addCard"
                    @update-card="updateCard"
                    @drag-start="onDragStart"
                    @drop-card="onDropCard"
                    @drop-column="onDropColumn"
                    @confirm-return="processReturn"
                    @cancel-return="cancelReturn"
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
            ],
            draggedCard: null,
            isReturnMode: false
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
        updateCard(updatedCard) {
            const index = this.cards.findIndex(c => c.id === updatedCard.id);
            if (index !== -1) {
                this.$set(this.cards, index, updatedCard);
            }
        },
        onDragStart(card) {
            this.draggedCard = card;
        },
        onDropCard(targetCard) {
            if (!this.draggedCard || this.draggedCard === targetCard) return;

            const fromCol = this.draggedCard.colNumber;
            const toCol = targetCard.colNumber;

            if (fromCol === 3 && toCol === 2) {
                this.isReturnMode = true;
                return;
            }

            if (fromCol === toCol || toCol === fromCol + 1) {
                this.moveCard(targetCard, toCol);
            }
        },
        onDropColumn(colId) {
            if (!this.draggedCard) return;
            const fromCol = this.draggedCard.colNumber;

            if (fromCol === 3 && colId === 2) {
                this.isReturnMode = true;
                return;
            }

            if (fromCol === colId || colId === fromCol + 1) {
                this.draggedCard.colNumber = colId;
                this.checkOverdue(this.draggedCard);
                
                const index = this.cards.indexOf(this.draggedCard);
                this.cards.splice(index, 1);
                this.cards.push(this.draggedCard);
                
                this.draggedCard = null;
            }
        },
        moveCard(targetCard, newColId) {
            const draggedIndex = this.cards.indexOf(this.draggedCard);
            const targetIndex = this.cards.indexOf(targetCard);
            
            this.cards.splice(draggedIndex, 1);
            
            const newTargetIndex = this.cards.indexOf(targetCard);
            if (draggedIndex < targetIndex) {
                this.cards.splice(newTargetIndex + 1, 0, this.draggedCard);
            } else {
                this.cards.splice(newTargetIndex, 0, this.draggedCard);
            }

            this.draggedCard.colNumber = newColId;
            this.draggedCard.returnReason = null;
            this.checkOverdue(this.draggedCard);
            
            this.draggedCard = null;
        },
        processReturn(reason) {
            this.draggedCard.returnReason = reason;
            this.draggedCard.colNumber = 2;
            
            const index = this.cards.indexOf(this.draggedCard);
            this.cards.splice(index, 1);
            
            const firstCol2Card = this.cards.find(c => c.colNumber === 2);
            if (firstCol2Card) {
                const targetIndex = this.cards.indexOf(firstCol2Card);
                this.cards.splice(targetIndex, 0, this.draggedCard);
            } else {
                this.cards.push(this.draggedCard);
            }

            this.isReturnMode = false;
            this.draggedCard = null;
        },
        cancelReturn() {
            this.isReturnMode = false;
            this.draggedCard = null;
        },
        checkOverdue(card) {
            if (card.colNumber === 4) {
                const today = new Date().toISOString().split('T')[0];
                card.isOverdue = today > card.deadline;
            }
        }
    }
})

let app = new Vue({
    el: '#app'
})