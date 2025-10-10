Что важно понимать

Проект, который ты скачал с Builder.io — это кодовая база, которую Builder сгенерировал на основе твоих визуальных блоков. Это односторонняя генерация, и по умолчанию:

Изменения в VS Code не обновляют Builder.io.

Но есть способы наладить двустороннюю (или хотя бы полуавтоматическую) синхронизацию.
✅ Цель: Cинхронизация Builder.io ⇄ VS Code

Вот какие есть варианты:

🔁 Вариант 1: Использование Builder SDK и загрузка контента по API

Этот способ позволяет связать твоё приложение в VS Code с контентом из Builder.io.

Шаги:

Установи SDK
npm install @builder.io/react
Инициализируй Builder в коде

import { builder, BuilderComponent } from '@builder.io/react';

builder.init('YOUR_PUBLIC_API_KEY');


🔑 API ключ ты найдёшь в Account Settings → API Key на builder.io

Создай компонент, который загружает данные с Builder.io

export default function Page({ content }) {
  return <BuilderComponent model="page" content={content} />;
}

export async function getStaticProps() {
  const content = await builder.get('page', { url: '/' }).toPromise();

  return {
    props: {
      content: content || null,
    },
  };
}


Теперь, когда ты редактируешь страницу на сайте Builder.io, изменения подгружаются в твоё локальное приложение через API.

📌 Изменения в VS Code при этом не синхронизируются обратно.

🔁 Вариант 2: Builder GitHub Integration (частичная синхронизация)

Если ты подключишь GitHub-репозиторий к Builder.io, то Builder сможет:

автоматически обновлять репозиторий, когда ты создаёшь/редактируешь компоненты в визуальном редакторе;

использовать компоненты из репозитория в UI.

🔧 Как подключить:

Перейди в Builder.io → Account Settings → Connected Services

Подключи GitHub.

Укажи, какие компоненты хранятся где.

🔁 Вариант 3: Использование Visual Copilot (если ты дизайнер)

Если ты создавал UI в Figma и сгенерировал код через Builder Copilot, ты можешь вручную экспортировать обновления из Figma → Builder → VS Code, но это пока не автоматизировано.

⚠️ Важно

Builder.io не отслеживает изменения в твоём коде в VS Code. То есть если ты:

меняешь структуру компонентов,

правишь логику,

стили...

...эти изменения не попадут обратно в Builder.io UI автоматически.

Чтобы Builder.io «понял» новый компонент, тебе нужно:

Зарегистрировать его в Builder через SDK.

Опубликовать его в Builder UI, чтобы дизайнеры могли использовать его в редакторе.

Пример:
import { Builder } from '@builder.io/react';

function MyComponent({ title }) {
  return <h1>{title}</h1>;
}

Builder.registerComponent(MyComponent, {
  name: 'MyComponent',
  inputs: [
    {
      name: 'title',
      type: 'string',
    },
  ],
});

✅ Резюме: как наладить синхронизацию
Действие	Способ
Получать контент из Builder в код	SDK + API
Использовать свои компоненты в Builder	Регистрировать их через Builder.registerComponent()
Синхронизировать с GitHub	Настроить GitHub интеграцию в Builder.io
Автоматически отправлять изменения из кода	❌ невозможно (только вручную обновлять JSON или компоненты)
