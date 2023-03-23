########################################################################################################################
# Build image
########################################################################################################################
FROM node:18-alpine AS build-stage

WORKDIR /build
COPY ./resources ./resources
COPY ./src ./src
COPY ./syntaxes ./syntaxes
COPY ./.vscodeignore .
COPY ./langium-config.json .
COPY ./language-configuration.json .
COPY ./package*.json .
COPY ./README.md  .
COPY tsconfig.json .
COPY webpack.config.js .

RUN npm ci
RUN npm run package

########################################################################################################################
# Runtime image
########################################################################################################################
FROM gitpod/openvscode-server:1.76.2

ENV VSCODE_HOME="/home/.openvscode-server"
ENV VSCODE="${VSCODE_HOME}/bin/openvscode-server"

COPY --chown=openvscode-server ./examples ./examples

RUN --mount=type=bind,from=build-stage,source=/build,target=/build $VSCODE --install-extension /build/*.vsix
RUN $VSCODE --install-extension usernamehw.errorlens

ENTRYPOINT [ "/bin/sh", "-c", "exec ${VSCODE} --host 0.0.0.0 --default-folder=examples --without-connection-token \"${@}\"", "--" ]

# Build with: docker buildx build --platform linux/arm64,linux/amd64 -t vscode-tinydsl:1.0.0 .
# Run with:   docker run -p 3000:3000 -it vscode-tinydsl:1.0.0
