import 'dotenv/config';
import { PrismaClient, Role, TaskStatus, TaskType, Priority, RewardEventType, ExternalLessonType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

const day = 24 * 60 * 60 * 1000;
const d = (offsetDays: number, hour = 18) => {
  const date = new Date(Date.now() + offsetDays * day);
  date.setHours(hour, 0, 0, 0);
  return date;
};

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log('Очистка базы данных...');

  await prisma.$transaction([
    prisma.rewardRedemption.deleteMany(),
    prisma.userBadge.deleteMany(),
    prisma.rewardTransaction.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.attachment.deleteMany(),
    prisma.checklistItem.deleteMany(),
    prisma.reflection.deleteMany(),
    prisma.topicProgress.deleteMany(),
    prisma.task.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.activityLog.deleteMany(),
    prisma.externalLesson.deleteMany(),
    prisma.topic.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.studentProfile.deleteMany(),
    prisma.user.deleteMany(),
    prisma.rewardItem.deleteMany(),
    prisma.badge.deleteMany(),
    prisma.rewardRule.deleteMany(),
  ]);

  console.log('1. Создание пользователей...');
  const adminPassword = await hashPassword('Admin123!');
  const teacherPassword = await hashPassword('Teacher123!');
  const studentPassword = await hashPassword('Student123!');
  const parentPassword = await hashPassword('Parent123!');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@tracker.ru',
      passwordHash: adminPassword,
      fullName: 'Администратор',
      role: Role.ADMIN,
    },
  });

  const teacher = await prisma.user.create({
    data: {
      email: 'teacher@tracker.ru',
      passwordHash: teacherPassword,
      fullName: 'Мария Ивановна',
      role: Role.TEACHER,
    },
  });

  const student = await prisma.user.create({
    data: {
      email: 'student@tracker.ru',
      passwordHash: studentPassword,
      fullName: 'Дмитрий',
      role: Role.STUDENT,
      timezone: 'Europe/Moscow',
    },
  });

  const parent = await prisma.user.create({
    data: {
      email: 'parent@tracker.ru',
      passwordHash: parentPassword,
      fullName: 'Наталья',
      role: Role.PARENT,
    },
  });

  console.log('2. Создание студенческого профиля...');
  await prisma.studentProfile.create({
    data: {
      userId: student.id,
      parentUserId: parent.id,
      grade: 8,
    },
  });

  console.log('3. Создание предметов (19)...');
  const subjectData = [
    { name: 'Алгебра', slug: 'algebra', color: '#3B82F6' },
    { name: 'Геометрия', slug: 'geometry', color: '#8B5CF6' },
    { name: 'Русский язык', slug: 'russian', color: '#EF4444' },
    { name: 'Литература', slug: 'literature', color: '#BE185D' },
    { name: 'Английский язык', slug: 'english', color: '#06B6D4' },
    { name: 'Информатика', slug: 'informatics', color: '#4F46E5' },
    { name: 'История', slug: 'history', color: '#D97706' },
    { name: 'География', slug: 'geography', color: '#16A34A' },
    { name: 'Биология', slug: 'biology', color: '#84CC16' },
    { name: 'Химия', slug: 'chemistry', color: '#059669' },
    { name: 'Физика', slug: 'physics', color: '#0EA5E9' },
    { name: 'Обществознание', slug: 'social-studies', color: '#A855F7' },
    { name: 'Вероятность и статистика', slug: 'probability-stats', color: '#EC4899' },
    { name: 'ОБЖ', slug: 'obzh', color: '#15803D' },
    { name: 'Технология', slug: 'technology', color: '#F97316' },
    { name: 'Музыка', slug: 'music', color: '#9333EA' },
    { name: 'ИЗО', slug: 'izo', color: '#F43F5E' },
    { name: 'Ораторское искусство', slug: 'oratory', color: '#6366F1' },
    { name: 'Развитие устной и письменной речи', slug: 'speech-development', color: '#14B8A6' },
  ];

  const subjects: Record<string, { id: number }> = {};
  for (const [index, s] of subjectData.entries()) {
    const created = await prisma.subject.create({
      data: {
        name: s.name,
        slug: s.slug,
        color: s.color,
        sortOrder: index + 1,
      },
    });
    subjects[s.slug] = { id: created.id };
  }

  console.log('4. Создание тем (Topic)...');
  const algebraTopics = {
    linear: await prisma.topic.create({
      data: { subjectId: subjects['algebra'].id, title: 'Линейные уравнения', lessonCode: 'Урок 12', sortOrder: 1 },
    }),
    quadratic: await prisma.topic.create({
      data: { subjectId: subjects['algebra'].id, title: 'Квадратные уравнения', lessonCode: 'Урок 13', sortOrder: 2 },
    }),
  };

  const englishTopics = {
    pastSimple: await prisma.topic.create({
      data: { subjectId: subjects['english'].id, title: 'Past Simple', lessonCode: 'Unit 5', sortOrder: 1 },
    }),
    presentPerfect: await prisma.topic.create({
      data: { subjectId: subjects['english'].id, title: 'Present Perfect', lessonCode: 'Unit 6', sortOrder: 2 },
    }),
  };

  console.log('5. Создание задач (9)...');
  const taskCreateInput = <T extends object>(data: T) => ({
    studentId: student.id,
    createdById: teacher.id,
    updatedById: teacher.id,
    ...data,
  });

  const task1 = await prisma.task.create({
    data: taskCreateInput({
      title: 'Решить № 112–117 на с. 84',
      description: 'Линейные уравнения с одной переменной. Показать полное решение каждого номера.',
      taskType: TaskType.HOMEWORK,
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      subjectId: subjects['algebra'].id,
      topicId: algebraTopics.linear.id,
      dueDate: d(0),
      plannedMinutes: 40,
      tags: ['алгебра', 'уравнения'],
    }),
  });

  const task2 = await prisma.task.create({
    data: taskCreateInput({
      title: 'Упр. 3–5 по Past Simple',
      description: 'Отрицательные и вопросительные предложения. Учебник Unit 5.',
      taskType: TaskType.HOMEWORK,
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      subjectId: subjects['english'].id,
      topicId: englishTopics.pastSimple.id,
      dueDate: d(1),
      plannedMinutes: 30,
    }),
  });

  const task3 = await prisma.task.create({
    data: taskCreateInput({
      title: 'Подготовка к лабораторной работе №4',
      description: 'Изучить описание опыта, повторить тему «Давление жидкостей и газов».',
      taskType: TaskType.LAB_WORK,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      subjectId: subjects['physics'].id,
      dueDate: d(7),
      plannedMinutes: 60,
    }),
  });

  const task4 = await prisma.task.create({
    data: taskCreateInput({
      title: 'Сочинение «Моя семья»',
      description: 'Текст 1,5–2 страницы. По плану, составленному на уроке.',
      taskType: TaskType.COMPOSITION,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      subjectId: subjects['russian'].id,
      dueDate: d(-1),
      plannedMinutes: 90,
    }),
  });

  const task5 = await prisma.task.create({
    data: taskCreateInput({
      title: 'Ответы на вопросы по §14',
      description: 'История России. Письменно ответить на 4 вопроса после параграфа.',
      taskType: TaskType.EXERCISE,
      status: TaskStatus.REVIEW,
      priority: Priority.MEDIUM,
      subjectId: subjects['history'].id,
      dueDate: d(0),
      plannedMinutes: 45,
    }),
  });

  const task6 = await prisma.task.create({
    data: taskCreateInput({
      title: 'Контрольная работа по квадратным уравнениям',
      description: '6 заданий базового и повышенного уровня.',
      taskType: TaskType.TEST,
      status: TaskStatus.DONE,
      priority: Priority.HIGH,
      subjectId: subjects['algebra'].id,
      topicId: algebraTopics.quadratic.id,
      dueDate: d(-3),
      completedAt: d(-2),
      maxPoints: 40,
      earnedPoints: 32,
      grade: 4,
      actualMinutes: 80,
      reflectionRequired: true,
      rewardAwarded: true,
      onTimeAwarded: true,
    }),
  });

  const task7 = await prisma.task.create({
    data: taskCreateInput({
      title: 'Тест на Present Perfect',
      description: 'Лексико-грамматический тест Unit 6. 8 заданий.',
      taskType: TaskType.TEST,
      status: TaskStatus.DONE,
      priority: Priority.HIGH,
      subjectId: subjects['english'].id,
      topicId: englishTopics.presentPerfect.id,
      dueDate: d(-4),
      completedAt: d(-4),
      maxPoints: 40,
      earnedPoints: 38,
      grade: 5,
      actualMinutes: 40,
      reflectionRequired: true,
      rewardAwarded: true,
      onTimeAwarded: true,
    }),
  });

  const task8 = await prisma.task.create({
    data: taskCreateInput({
      title: 'Анализ стихотворения «Бородино»',
      description: 'Средства выразительности, главная мысль. Ответ объёмом 1 страница.',
      taskType: TaskType.ESSAY,
      status: TaskStatus.REWORK,
      priority: Priority.MEDIUM,
      subjectId: subjects['literature'].id,
      dueDate: d(-3),
      plannedMinutes: 60,
    }),
  });

  const task9 = await prisma.task.create({
    data: taskCreateInput({
      title: 'Алгоритмы: практикум',
      description: 'Линейные алгоритмы, блок-схемы. Подготовка к контрольной.',
      taskType: TaskType.EXERCISE,
      status: TaskStatus.BACKLOG,
      priority: Priority.LOW,
      subjectId: subjects['informatics'].id,
      dueDate: d(10),
      plannedMinutes: 45,
    }),
  });

  console.log('6. Создание чек-листов...');
  await prisma.checklistItem.createMany({
    data: [
      { taskId: task1.id, text: 'Переписать условие', sortOrder: 1 },
      { taskId: task1.id, text: 'Найти корень каждого уравнения', sortOrder: 2 },
      { taskId: task1.id, text: 'Выполнить проверку подстановкой', sortOrder: 3 },
      { taskId: task1.id, text: 'Проверить оформление', sortOrder: 4 },
      { taskId: task6.id, text: 'Заполнить лист ответов', sortOrder: 1 },
      { taskId: task6.id, text: 'Проверить вычисления', sortOrder: 2 },
      { taskId: task6.id, text: 'Записать ответ', sortOrder: 3 },
      { taskId: task9.id, text: 'Прочитать теорию', sortOrder: 1 },
      { taskId: task9.id, text: 'Выполнить 2 блок-схемы', sortOrder: 2 },
      { taskId: task9.id, text: 'Сверить с ответами', sortOrder: 3 },
    ],
  });

  console.log('7. Создание комментариев...');
  await prisma.comment.createMany({
    data: [
      { taskId: task1.id, authorId: teacher.id, text: 'Не забудь показать решение полностью, а не только ответ.' },
      { taskId: task5.id, authorId: teacher.id, text: 'Отлично, жду на проверку. Обрати внимание на вопрос №3.' },
      { taskId: task8.id, authorId: teacher.id, text: 'Переделай: добавь вывод о главной мысли и более подробный разбор средств выразительности.' },
    ],
  });

  console.log('8. Создание рефлексий...');
  await prisma.reflection.createMany({
    data: [
      {
        studentId: student.id,
        taskId: task6.id,
        subjectId: subjects['algebra'].id,
        topicId: algebraTopics.quadratic.id,
        difficulty: 4,
        confidence: 3,
        whatWasHard: 'Сильно тяжёлое 6 задание',
        whatHelped: 'Алгоритм решения из конспекта',
        actualMinutes: 80,
        createdAt: d(-2, 19),
      },
      {
        studentId: student.id,
        taskId: task7.id,
        subjectId: subjects['english'].id,
        topicId: englishTopics.presentPerfect.id,
        difficulty: 2,
        confidence: 5,
        whatWasEasy: 'Всё далось легко',
        whatHelped: 'Повторение правил на уроке',
        actualMinutes: 40,
        createdAt: d(-4, 20),
      },
      {
        studentId: student.id,
        taskId: task8.id,
        subjectId: subjects['literature'].id,
        difficulty: 3,
        confidence: 3,
        whatWasHard: 'Найти средства выразительности',
        needHelp: true,
        actualMinutes: 55,
        createdAt: d(-3, 18),
      },
    ],
  });

  console.log('9. Создание наград...');
  const ruleHomework = await prisma.rewardRule.create({
    data: { code: 'homework_completed', name: 'Выполнено домашнее задание', description: 'Начисление за выполненное ДЗ', points: 10, eventType: RewardEventType.HOMEWORK_COMPLETED },
  });
  const ruleOnTime = await prisma.rewardRule.create({
    data: { code: 'on_time', name: 'Сдано вовремя', description: 'Бонус за сдачу в срок', points: 5, eventType: RewardEventType.TASK_COMPLETED_ON_TIME },
  });
  const ruleReflection = await prisma.rewardRule.create({
    data: { code: 'reflection_submitted', name: 'Заполнена рефлексия', description: 'Начисление за заполненную рефлексию', points: 3, eventType: RewardEventType.REFLECTION_SUBMITTED },
  });
  const ruleTopic = await prisma.rewardRule.create({
    data: { code: 'topic_completed', name: 'Пройдена тема', description: 'Бонус за завершённую тему', points: 30, eventType: RewardEventType.TOPIC_COMPLETED },
  });
  const ruleStreak = await prisma.rewardRule.create({
    data: { code: 'streak_achieved', name: 'Серия: 3 дня подряд', description: 'Бонус за серию выполнений', points: 20, eventType: RewardEventType.STREAK_ACHIEVED },
  });

  const badgeFirstDone = await prisma.badge.create({
    data: { code: 'first_done', name: 'Первая победа', description: 'За первую выполненную задачу', icon: 'trophy' },
  });
  const badgeOnTime = await prisma.badge.create({
    data: { code: 'on_time', name: 'Точно в срок', description: 'За сдачу заданий без опозданий', icon: 'clock' },
  });
  const badgeReflection = await prisma.badge.create({
    data: { code: 'reflection_master', name: 'Мастер рефлексии', description: 'За 3 заполненные рефлексии подряд', icon: 'book' },
  });
  const badgeTopic = await prisma.badge.create({
    data: { code: 'topic_explorer', name: 'Тема закрыта', description: 'За полное прохождение темы', icon: 'flag' },
  });
  const badgeComeback = await prisma.badge.create({
    data: { code: 'comeback', name: 'Не сдаюсь', description: 'За успешную доработку задачи', icon: 'shield' },
  });

  await prisma.rewardTransaction.createMany({
    data: [
      {
        studentId: student.id,
        points: 10,
        balanceAfter: 10,
        ruleId: ruleHomework.id,
        taskId: task6.id,
        reason: 'Выполнена контрольная работа',
        isManual: false,
        createdById: teacher.id,
        createdAt: d(-2),
      },
      {
        studentId: student.id,
        points: 5,
        balanceAfter: 15,
        ruleId: ruleOnTime.id,
        taskId: task7.id,
        reason: 'Тест сдан вовремя',
        isManual: false,
        createdById: teacher.id,
        createdAt: d(-4),
      },
      {
        studentId: student.id,
        points: 3,
        balanceAfter: 18,
        ruleId: ruleReflection.id,
        taskId: task7.id,
        reason: 'Заполнена рефлексия',
        isManual: false,
        createdById: teacher.id,
        createdAt: d(-4, 20),
      },
    ],
  });

  await prisma.userBadge.createMany({
    data: [
      { userId: student.id, badgeId: badgeFirstDone.id, taskId: task6.id, earnedAt: d(-2) },
      { userId: student.id, badgeId: badgeReflection.id, taskId: task7.id, earnedAt: d(-4) },
    ],
  });

  console.log('9.1. Создание уведомлений...');
  await prisma.notification.createMany({
    data: [
      {
        userId: student.id,
        type: 'task_created',
        taskId: task1.id,
        subjectId: subjects['algebra'].id,
        payload: { taskTitle: task1.title, subjectName: 'Алгебра' },
        createdAt: d(-1, 10),
      },
      {
        userId: student.id,
        type: 'task_done',
        taskId: task7.id,
        payload: { taskTitle: 'Тест на Present Perfect' },
        createdAt: d(-1, 19),
      },
      {
        userId: student.id,
        type: 'badge_earned',
        payload: { badgeName: 'Мастер рефлексии' },
        createdAt: d(0, 9),
      },
    ],
  });

  console.log('10. Создание внешних уроков («Точки Знаний»)...');
  await prisma.externalLesson.createMany({
    data: [
      {
        subjectId: subjects['algebra'].id,
        topicId: algebraTopics.linear.id,
        title: 'Урок 12. Линейные уравнения (запись)',
        url: 'https://tochkiznaniy.ru/algebra/lesson-12-linear-equations',
        type: ExternalLessonType.RECORD,
        description: 'Видеоурок по решению линейных уравнений с одной переменной.',
        durationMinutes: 45,
        source: 'Точки Знаний',
        createdById: teacher.id,
      },
      {
        subjectId: subjects['algebra'].id,
        topicId: algebraTopics.quadratic.id,
        title: 'Урок 13. Квадратные уравнения (запись)',
        url: 'https://tochkiznaniy.ru/algebra/lesson-13-quadratic-equations',
        type: ExternalLessonType.RECORD,
        description: 'Видеоурок: формула корней квадратного уравнения.',
        durationMinutes: 48,
        source: 'Точки Знаний',
        createdById: teacher.id,
      },
      {
        subjectId: subjects['english'].id,
        topicId: englishTopics.pastSimple.id,
        title: 'Past Simple: онлайн-урок',
        url: 'https://tochkiznaniy.ru/english/past-simple-online',
        type: ExternalLessonType.ONLINE,
        description: 'Прямой эфир: Past Simple, прошедшее время.',
        durationMinutes: 55,
        source: 'Точки Знаний',
        createdById: teacher.id,
      },
    ],
  });

  const counts = {
    users: await prisma.user.count(),
    subjects: await prisma.subject.count(),
    topics: await prisma.topic.count(),
    tasks: await prisma.task.count(),
    checklistItems: await prisma.checklistItem.count(),
    comments: await prisma.comment.count(),
    reflections: await prisma.reflection.count(),
    rewardRules: await prisma.rewardRule.count(),
    badges: await prisma.badge.count(),
    rewardTransactions: await prisma.rewardTransaction.count(),
    userBadges: await prisma.userBadge.count(),
    externalLessons: await prisma.externalLesson.count(),
  };

  console.log('\n=== SEED ЗАВЕРШЁН ===');
  console.table(counts);
}

main()
  .catch((error) => {
    console.error('Ошибка при заполнении базы данных:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });