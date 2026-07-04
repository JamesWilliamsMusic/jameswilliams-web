# [1.0.0-feat-deploy-pipeline-ssm.4](https://github.com/JamesWilliamsMusic/jameswilliams-web/compare/v1.0.0-feat-deploy-pipeline-ssm.3...v1.0.0-feat-deploy-pipeline-ssm.4) (2026-07-04)


### Bug Fixes

* use correct Lambda Web Adapter image path (awsguru/aws-lambda-adapter:1.0.1) ([1c4be42](https://github.com/JamesWilliamsMusic/jameswilliams-web/commit/1c4be42284730640229922b4d55aa50d817baa0a))

# [1.0.0-feat-deploy-pipeline-ssm.3](https://github.com/JamesWilliamsMusic/jameswilliams-web/compare/v1.0.0-feat-deploy-pipeline-ssm.2...v1.0.0-feat-deploy-pipeline-ssm.3) (2026-07-04)


### Bug Fixes

* update Lambda Web Adapter image path to new ECR location ([3c6f4d3](https://github.com/JamesWilliamsMusic/jameswilliams-web/commit/3c6f4d37e7a92062e594502ffaf5f53ead497380))

# [1.0.0-feat-deploy-pipeline-ssm.2](https://github.com/JamesWilliamsMusic/jameswilliams-web/compare/v1.0.0-feat-deploy-pipeline-ssm.1...v1.0.0-feat-deploy-pipeline-ssm.2) (2026-07-04)


### Bug Fixes

* use node-slim base with Lambda Web Adapter per official example ([262954c](https://github.com/JamesWilliamsMusic/jameswilliams-web/commit/262954c7fa6287b944355e223562421848d943de))

# 1.0.0-feat-deploy-pipeline-ssm.1 (2026-07-04)


### Bug Fixes

* add ts-node dependency and passWithNoTests flag for Jest ([8edd36b](https://github.com/JamesWilliamsMusic/jameswilliams-web/commit/8edd36b021d31696753705c6a9bbc516f7f188b5))
* correct role-to-arn to role-to-assume in AWS credentials action ([2956931](https://github.com/JamesWilliamsMusic/jameswilliams-web/commit/2956931d878ce48e7942d28357e76d45d47e2cc6))
* hardcode ECR_REPOSITORY to jameswilliams-web ([003836e](https://github.com/JamesWilliamsMusic/jameswilliams-web/commit/003836ef33a7ffb625c998c3c52f44c78f144d1f))
* keep tsconfig.json and next.config.js in Docker build context ([2986a2e](https://github.com/JamesWilliamsMusic/jameswilliams-web/commit/2986a2e617bb93a74b49ecb0031500560ad4b49f))
* remove tsconfig and next.config from dockerignore in skill template ([95a209a](https://github.com/JamesWilliamsMusic/jameswilliams-web/commit/95a209a0fa7b97bc4eae51ee438152bf8b51093a))


### Features

* add Golden Coast site with Webiny CMS integration ([3fd168e](https://github.com/JamesWilliamsMusic/jameswilliams-web/commit/3fd168e82e625cbea59b1d2c5743786a39f98d0b))
* bootstrap Next.js project with Lambda deployment scaffold ([eebc718](https://github.com/JamesWilliamsMusic/jameswilliams-web/commit/eebc718ab5435b3db70354a53a740b428e954190))
* implement Golden Coast design system with warm editorial aesthetic ([8751e64](https://github.com/JamesWilliamsMusic/jameswilliams-web/commit/8751e64d84238c03a80f2fe57d2eedff9117e6b9))
* wire deploy pipeline to SSM params, Lambda update, and dev-music-portfolio ECR ([6b5e5a1](https://github.com/JamesWilliamsMusic/jameswilliams-web/commit/6b5e5a1bc7d4558a044ca3375d340f6ad7eaca1a))

# 1.0.0-feat-golden-coast-site.1 (2026-06-25)


### Bug Fixes

* add ts-node dependency and passWithNoTests flag for Jest ([8edd36b](https://github.com/JamesWilliamsMusic/jameswilliams-web/commit/8edd36b021d31696753705c6a9bbc516f7f188b5))
* correct role-to-arn to role-to-assume in AWS credentials action ([2956931](https://github.com/JamesWilliamsMusic/jameswilliams-web/commit/2956931d878ce48e7942d28357e76d45d47e2cc6))
* hardcode ECR_REPOSITORY to jameswilliams-web ([003836e](https://github.com/JamesWilliamsMusic/jameswilliams-web/commit/003836ef33a7ffb625c998c3c52f44c78f144d1f))
* keep tsconfig.json and next.config.js in Docker build context ([2986a2e](https://github.com/JamesWilliamsMusic/jameswilliams-web/commit/2986a2e617bb93a74b49ecb0031500560ad4b49f))
* remove tsconfig and next.config from dockerignore in skill template ([95a209a](https://github.com/JamesWilliamsMusic/jameswilliams-web/commit/95a209a0fa7b97bc4eae51ee438152bf8b51093a))


### Features

* add Golden Coast site with Webiny CMS integration ([3fd168e](https://github.com/JamesWilliamsMusic/jameswilliams-web/commit/3fd168e82e625cbea59b1d2c5743786a39f98d0b))
* bootstrap Next.js project with Lambda deployment scaffold ([eebc718](https://github.com/JamesWilliamsMusic/jameswilliams-web/commit/eebc718ab5435b3db70354a53a740b428e954190))

# [1.0.0-feat-bootstrap-nextjs-project.3](https://github.com/JamesWilliamsMusic/jameswilliams-web/compare/v1.0.0-feat-bootstrap-nextjs-project.2...v1.0.0-feat-bootstrap-nextjs-project.3) (2026-06-04)


### Bug Fixes

* hardcode ECR_REPOSITORY to jameswilliams-web ([003836e](https://github.com/JamesWilliamsMusic/jameswilliams-web/commit/003836ef33a7ffb625c998c3c52f44c78f144d1f))

# [1.0.0-feat-bootstrap-nextjs-project.2](https://github.com/JamesWilliamsMusic/jameswilliams-web/compare/v1.0.0-feat-bootstrap-nextjs-project.1...v1.0.0-feat-bootstrap-nextjs-project.2) (2026-06-04)


### Bug Fixes

* correct role-to-arn to role-to-assume in AWS credentials action ([2956931](https://github.com/JamesWilliamsMusic/jameswilliams-web/commit/2956931d878ce48e7942d28357e76d45d47e2cc6))

# 1.0.0-feat-bootstrap-nextjs-project.1 (2026-06-04)


### Bug Fixes

* add ts-node dependency and passWithNoTests flag for Jest ([8edd36b](https://github.com/JamesWilliamsMusic/jameswilliams-web/commit/8edd36b021d31696753705c6a9bbc516f7f188b5))


### Features

* bootstrap Next.js project with Lambda deployment scaffold ([eebc718](https://github.com/JamesWilliamsMusic/jameswilliams-web/commit/eebc718ab5435b3db70354a53a740b428e954190))
